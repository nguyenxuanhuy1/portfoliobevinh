import learnTopicRepo from '../repository/learnTopic.repo.js'

const callGeminiAI = async (topicData, userAnswers, customApiKey) => {
  const apiKey = customApiKey
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING')
  }

  const prompt = `
You are an AI English Tutor. Grade the student's answers based on the Lesson JSON and User Answers.

Lesson JSON:
${JSON.stringify(topicData, null, 2)}

User Answers:
${JSON.stringify(userAnswers, null, 2)}

Requirements:
1. Calculate a total_score from 0 to 100 based on overall accuracy (give appropriate weight to all questions: total 32 questions across matching, mcq, fill_with_bank, translate, definition, error_correction, open_ended).
2. Return a detailed "exercises" array containing grading for each of the exercise types present in the Lesson JSON.
3. For objective exercises (matching, multiple_choice, fill_with_bank, definition_to_word), check if their answer is correct against the correct "answer" field. Mark "correct" as true or false.
4. For subjective exercises (translate_to_english, error_correction, open_ended), compare their answer with the suggested correct/suggested answer or keywords, grade it constructively, and mark "correct" as true/false. Be lenient with minor typos or casing.
5. Provide a helpful, constructive "feedback" string for each individual question, explaining why it is correct or incorrect.
6. Provide an "overall_feedback" summarizing their performance and offering encouragement.

Response JSON format MUST be exactly:
{
  "total_score": 80,
  "overall_feedback": "Feedback in Vietnamese language.",
  "exercises": [
    {
      "type": "matching",
      "score": 100,
      "feedback": "Feedback for matching in Vietnamese.",
      "questions": [
        {
          "id": 1,
          "correct": true,
          "user_answer": "...",
          "correct_answer": "...",
          "feedback": "Feedback for question in Vietnamese."
        }
      ]
    }
  ]
}

Return ONLY the raw valid JSON. Do NOT wrap in markdown backticks \`\`\`json ... \`\`\`. Do NOT include any explanations outside the JSON.
`

  const callModel = async (modelName) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`${response.status} - ${errText}`)
    }

    const result = await response.json()
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResponse) {
      throw new Error('Không nhận được phản hồi từ Gemini')
    }

    return JSON.parse(textResponse.trim())
  }

  try {
    // Thử model thế hệ mới gemini-2.5-flash trước
    return await callModel('gemini-2.5-flash')
  } catch (error) {
    console.warn(`[Gemini AI] Thử nghiệm gemini-2.5-flash thất bại, tự động chuyển sang gemini-1.5-flash dự phòng... Chi tiết:`, error.message)
    try {
      // Tự động dự phòng sang gemini-1.5-flash ổn định
      return await callModel('gemini-1.5-flash')
    } catch (fallbackError) {
      console.error('[Gemini AI Grading Error]: Cả hai model flash của Google đều báo lỗi:', fallbackError.message)
      throw fallbackError
    }
  }
}

const localFallbackGrade = (topicData, userAnswers) => {
  console.log('[Grading] Running local fallback grading engine...')
  const exercises = []
  let totalQuestions = 0
  let correctQuestions = 0

  const getAnswersForType = (type) => {
    const ansMap = userAnswers.find((item) => item.type === type)
    return ansMap?.answers || {}
  }

  for (const ex of topicData.exercises || []) {
    const type = ex.type
    const userAns = getAnswersForType(type)
    const questionsGrade = []
    let exCorrect = 0
    let exTotal = 0

    for (const q of ex.questions || []) {
      const qId = q.id.toString()
      const studentAns = (userAns[qId] || '').trim()
      let isCorrect = false
      let correctAns = ''

      if (type === 'matching') {
        correctAns = q.answer || ''
        isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase()
      } else if (type === 'multiple_choice') {
        correctAns = q.answer || ''
        isCorrect = studentAns.toUpperCase() === correctAns.toUpperCase()
      } else if (type === 'fill_with_bank') {
        correctAns = q.answer || ''
        isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase()
      } else if (type === 'definition_to_word') {
        correctAns = q.answer || ''
        isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase()
      } else if (type === 'translate_to_english') {
        correctAns = q.answer || ''
        isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase()
      } else if (type === 'error_correction') {
        correctAns = q.correct_sentence || ''
        isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase()
      } else if (type === 'open_ended') {
        correctAns = q.suggested_answer || ''
        isCorrect = studentAns.length > 10 // Simply check if they wrote something reasonable
      }

      if (isCorrect) {
        exCorrect++
        correctQuestions++
      }
      exTotal++
      totalQuestions++

      questionsGrade.push({
        id: q.id,
        correct: isCorrect,
        user_answer: studentAns,
        correct_answer: correctAns,
        feedback: isCorrect ? 'Chính xác!' : `Chưa chính xác. Đáp án đúng là: ${correctAns}`,
      })
    }

    const exScore = exTotal > 0 ? Math.round((exCorrect / exTotal) * 100) : 0
    exercises.push({
      type,
      score: exScore,
      feedback: `Hoàn thành phần ${type}. Trả lời đúng ${exCorrect}/${exTotal} câu.`,
      questions: questionsGrade,
    })
  }

  const totalScore = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0

  return {
    total_score: totalScore,
    overall_feedback: `[Chế độ Offline] Bạn đạt điểm số ${totalScore}%. Hãy cấu hình thêm GEMINI_API_KEY trên máy chủ để nhận phản hồi chi tiết từ Trí Tuệ Nhân Tạo!`,
    exercises,
  }
}

const learnTopicService = {
  async getAllTopics() {
    return learnTopicRepo.findAll()
  },

  async getTopicById(id) {
    return learnTopicRepo.findById(id)
  },

  async createTopic(data) {
    if (!data.name || !data.data) {
      throw new Error('Thiếu tên chủ đề hoặc dữ liệu JSON')
    }
    return learnTopicRepo.create(data)
  },

  async updateTopic(id, data) {
    if (!data.name || !data.data) {
      throw new Error('Thiếu tên chủ đề hoặc dữ liệu JSON')
    }
    return learnTopicRepo.update(id, data)
  },

  async deleteTopic(id) {
    return learnTopicRepo.delete(id)
  },

  async gradeTopic(id, userAnswers, customApiKey) {
    const topic = await learnTopicRepo.findById(id)
    if (!topic) {
      throw new Error('Chủ đề học không tồn tại')
    }

    const topicData = typeof topic.data === 'string' ? JSON.parse(topic.data) : topic.data

    if (!customApiKey || !customApiKey.trim()) {
      throw new Error('Vui lòng cấu hình Gemini API Key cá nhân trong phần Cấu hình để thực hiện nộp và chấm bài AI!')
    }

    try {
      // Try to call Gemini API
      return await callGeminiAI(topicData, userAnswers, customApiKey)
    } catch (error) {
      console.error('[Gemini AI Grading Error]:', error.message)
      throw new Error('Khóa API Key của bạn không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra và cập nhật lại trong phần Cấu hình!')
    }
  }
}

export default learnTopicService
