const { query, getClient } = require('../db');
const { cacheGet, cacheSet, cacheDel } = require('../db/redis');

// ── GET /api/tests (admin: all; student: published & accessible)
async function listTests(req, res) {
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;
  
  const isSuperAdmin = req.user.is_super_admin === true;

  let queryText = `
    SELECT t.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM sections s WHERE s.test_id = t.id) as section_count,
      (SELECT COUNT(*) FROM sub WHERE sub.test_id = t.id) as submission_count
    FROM tests t
    LEFT JOIN users u ON t.created_by = u.id
  `;

  if (isAdmin) {
    if (isSuperAdmin) {
      queryText += ' ORDER BY t.created_at DESC';
    } else {
      queryText += ` WHERE t.created_by = $1 OR $1 = ANY(t.collaborators) ORDER BY t.created_at DESC`;
    }
  } else {
    queryText += " WHERE t.status = 'published' ORDER BY t.created_at DESC";
  }

  const { rows } = isAdmin && !isSuperAdmin 
    ? await query(queryText, [userId])
    : await query(queryText);

  res.json({ tests: rows });
}

// ── GET /api/tests/:id (with all sections + questions)
async function getTest(req, res) {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  const cacheKey = `test:${id}:full`;
  if (!isAdmin) {
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);
  }

  const { rows: testRows } = await query('SELECT * FROM tests WHERE id = $1', [id]);
  if (!testRows.length) return res.status(404).json({ error: 'Test not found' });
  const test = testRows[0];

  if (!isAdmin && test.status !== 'published') return res.status(403).json({ error: 'Test not available' });

  const { rows: sections } = await query(
    'SELECT * FROM sections WHERE test_id = $1 ORDER BY order_index',
    [id]
  );

  for (const section of sections) {
    if (section.type === 'aptitude') {
      const { rows: questions } = await query(
        `SELECT id, type, text, image_url, options, option_images, marks, difficulty, order_index
         ${isAdmin ? ', correct_answer, explanation' : ''}
         FROM questions WHERE section_id = $1 ORDER BY order_index`,
        [section.id]
      );
      section.questions = questions;
    } else {
      const { rows: problems } = await query(
        `SELECT id, title, description, image_url, input_format, output_format, constraints,
         sample_input, sample_output, starter_code, marks, difficulty, tags, time_limit_seconds, memory_limit_mb
         ${isAdmin ? ', test_cases, explanation' : ", (SELECT jsonb_agg(tc) FROM jsonb_array_elements(test_cases) tc WHERE NOT (tc->>'isHidden')::boolean) as test_cases"}
         FROM coding_problems WHERE section_id = $1 ORDER BY order_index`,
        [section.id]
      );
      section.questions = problems;
    }
  }

  const result = { ...test, sections };
  if (!isAdmin) await cacheSet(cacheKey, result, 300);

  res.json(result);
}

// ── POST /api/tests (admin only)
async function createTest(req, res) {
  const { title, description, status, startTime, endTime, durationMinutes, settings, sections, collaborators } = req.body;

  if (!title) return res.status(400).json({ error: 'Title required' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [test] } = await client.query(
      `INSERT INTO tests (title, description, status, start_time, end_time, duration_minutes, settings, created_by, collaborators)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, description, status || 'draft', startTime || null, endTime || null,
       durationMinutes || 90, JSON.stringify(settings || {}), req.user.id, collaborators || []]
    );

    if (sections?.length) {
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const { rows: [section] } = await client.query(
          'INSERT INTO sections (test_id, name, type, order_index) VALUES ($1,$2,$3,$4) RETURNING *',
          [test.id, sec.name, sec.type, si]
        );

        if (sec.questions?.length) {
          for (let qi = 0; qi < sec.questions.length; qi++) {
            const q = sec.questions[qi];
            if (sec.type === 'aptitude') {
              await client.query(
                `INSERT INTO questions (section_id, type, text, image_url, options, option_images, correct_answer, explanation, marks, difficulty, order_index)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [section.id, q.type || 'mcq', q.text, q.imageUrl || null,
                 JSON.stringify(q.options || []), JSON.stringify(q.optionImages || []),
                 JSON.stringify(q.correctAnswer), q.explanation, q.marks || 2, q.difficulty || 'medium', qi]
              );
            } else {
              await client.query(
                `INSERT INTO coding_problems (section_id, title, description, image_url, input_format, output_format,
                 constraints, sample_input, sample_output, explanation, test_cases, starter_code,
                 time_limit_seconds, memory_limit_mb, marks, difficulty, tags, order_index)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                [section.id, q.title, q.description, q.imageUrl || null, q.inputFormat, q.outputFormat,
                 q.constraints, q.sampleInput, q.sampleOutput, q.explanation,
                 JSON.stringify(q.testCases || []), JSON.stringify(q.starterCode || {}),
                 q.timeLimit || 2, q.memoryLimit || 256, q.marks || 10, q.difficulty || 'medium', q.tags, qi]
              );
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ test, message: 'Test created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── PUT /api/tests/:id
async function updateTest(req, res) {
  const { id } = req.params;
  const { title, description, status, startTime, endTime, durationMinutes, settings, collaborators } = req.body;

  const { rows } = await query(
    `UPDATE tests SET title=$1, description=$2, status=$3, start_time=$4, end_time=$5,
     duration_minutes=$6, settings=$7, collaborators=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
    [title, description, status, startTime || null, endTime || null,
     durationMinutes, JSON.stringify(settings || {}), collaborators || [], id]
  );

  if (!rows.length) return res.status(404).json({ error: 'Test not found' });

  await cacheDel(`test:${id}:full`);
  res.json({ test: rows[0] });
}

// ── DELETE /api/tests/:id
async function deleteTest(req, res) {
  const { id } = req.params;
  await query('DELETE FROM tests WHERE id = $1', [id]);
  await cacheDel(`test:${id}:full`);
  res.json({ message: 'Test deleted' });
}

// ── POST /api/tests/:id/duplicate
async function duplicateTest(req, res) {
  const { id } = req.params;
  const { rows: [orig] } = await query('SELECT * FROM tests WHERE id = $1', [id]);
  if (!orig) return res.status(404).json({ error: 'Test not found' });

  req.body = {
    ...orig,
    title: `${orig.title} (Copy)`,
    status: 'draft',
    settings: orig.settings,
    sections: (await buildTestData(id)).sections,
  };
  return createTest(req, res);
}

async function buildTestData(testId) {
  const { rows: sections } = await query('SELECT * FROM sections WHERE test_id=$1 ORDER BY order_index', [testId]);
  for (const s of sections) {
    if (s.type === 'aptitude') {
      const { rows } = await query('SELECT * FROM questions WHERE section_id=$1 ORDER BY order_index', [s.id]);
      s.questions = rows;
    } else {
      const { rows } = await query('SELECT * FROM coding_problems WHERE section_id=$1 ORDER BY order_index', [s.id]);
      s.questions = rows;
    }
  }
  return { sections };
}

module.exports = { listTests, getTest, createTest, updateTest, deleteTest, duplicateTest };
