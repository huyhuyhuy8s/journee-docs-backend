import { Request, Response } from "express";

/**
 * FAQ Controller
 *
 * Provides FAQ search functionality for LiveDocs
 * - Vietnamese queries: Fetched from external ngrok service
 * - English queries: Local FAQ database
 *
 * Endpoints:
 * - GET /api/faq/search?query=question
 * - POST /api/faq/search with { query: "question" }
 *
 * Response format:
 * {
 *   success: boolean,
 *   data: {
 *     query: string,
 *     answer: string,
 *     language: 'vi' | 'en',
 *     source: 'external' | 'local'
 *   },
 *   timestamp: string
 * }
 */

// Function to detect Vietnamese text
function isVietnamese(text: string): boolean {
  // Vietnamese specific characters
  const vietnameseChars =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  // Vietnamese common words
  const vietnameseWords =
    /\b(tôi|bạn|của|với|trong|một|này|đó|như|có|được|để|và|hoặc|nhưng|khi|nào|làm|gì|sao|thế|tại|về|từ|đến|cho|vào|ra|lên|xuống|qua|theo|sau|trước|giữa|bên|cạnh|dưới|trên|ngoài|trong|nếu|mà|thì|sẽ|đã|đang|sắp|vừa|mới|cũ|lớn|nhỏ|cao|thấp|dài|ngắn|rộng|hẹp|nhanh|chậm|tốt|xấu|đẹp|tệ|dễ|khó|nhiều|ít|tất cả|không|chẳng|chưa|rồi|còn|lại|nữa|thêm|bớt|cùng|cũng|vẫn|vậy|thậy|các|những|mỗi|toàn|suốt|luôn|thường|hay|thỉnh thoảng|đôi khi|bao giờ|mãi|hoài|mãi mãi)\b/i;

  return vietnameseChars.test(text) || vietnameseWords.test(text);
}

// Fetch answer from external Vietnamese FAQ service
async function fetchVietnameseFAQ(
  query: string
): Promise<{ answer: string; from_cache?: boolean } | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://christiana-ungovernable-miranda.ngrok-free.dev/chat?query=${encodedQuery}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "LiveDocs-FAQ-Service/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error(`Vietnamese FAQ service error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      query?: string;
      answer?: string;
      from_cache?: boolean;
    };

    if (data && data.answer) {
      return {
        answer: data.answer,
        from_cache: data.from_cache || false,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching from Vietnamese FAQ service:", error);
    return null;
  }
}

// English FAQ data - local fallback
const englishFaqData = [
  {
    question: "How do I create a new document?",
    answer:
      "To create a new document, click on the 'Add Document' button on your dashboard. You can then give your document a title and start editing immediately. The document will be saved automatically as you type.",
    keywords: ["create", "new", "document", "add", "make"],
  },
  {
    question: "How do I share a document with others?",
    answer:
      "To share a document, open the document and click the 'Share' button in the top-right corner. Enter the email addresses of people you want to collaborate with and set their permission level (viewer or editor). They will receive an invitation to access the document.",
    keywords: ["share", "collaborate", "invite", "permission", "access"],
  },
  {
    question: "How do I change document permissions?",
    answer:
      "To change document permissions, open the document and click the 'Share' button. You'll see a list of current collaborators where you can change their permission levels from viewer to editor or remove their access entirely. Note: Only document owners can change permissions.",
    keywords: ["permission", "access", "owner", "editor", "viewer", "change"],
  },
  {
    question: "Can I work offline?",
    answer:
      "LiveDocs requires an internet connection for real-time collaboration features. However, if you lose connection temporarily, your changes will be saved locally and synchronized once you're back online. For the best experience, we recommend staying connected.",
    keywords: ["offline", "internet", "connection", "sync", "local"],
  },
  {
    question: "How do I add comments to a document?",
    answer:
      "To add a comment, select the text you want to comment on and click the comment icon that appears. Type your comment and press submit. Other collaborators will see your comment in real-time and can reply to it.",
    keywords: ["comment", "reply", "feedback", "discuss", "note"],
  },
  {
    question: "How do I delete a document?",
    answer:
      "To delete a document, go to your documents list and click the three-dot menu next to the document you want to delete. Select 'Delete' from the menu. Note: Only document owners can delete documents, and this action cannot be undone.",
    keywords: ["delete", "remove", "owner", "permanent"],
  },
  {
    question: "I forgot my password, how do I reset it?",
    answer:
      "To reset your password, go to the sign-in page and click 'Forgot Password'. Enter your email address and you'll receive a password reset link. Follow the instructions in the email to create a new password.",
    keywords: ["password", "reset", "forgot", "email", "login"],
  },
  {
    question: "How do I see who's currently editing a document?",
    answer:
      "When you're in a document, you can see active collaborators in the top-right corner of the editor. Their profile pictures or initials will be displayed, and you'll see their live cursors and selections as they edit.",
    keywords: ["collaborators", "active", "live", "cursor", "editing", "who"],
  },
  {
    question: "Can I format text in the editor?",
    answer:
      "Yes! LiveDocs supports rich text formatting including bold, italic, underline, headings, lists, and more. You can use the formatting toolbar or keyboard shortcuts like Ctrl+B for bold, Ctrl+I for italic, etc.",
    keywords: [
      "format",
      "bold",
      "italic",
      "heading",
      "list",
      "toolbar",
      "shortcuts",
    ],
  },
  {
    question: "How do I rename a document?",
    answer:
      "To rename a document, you can either click on the document title when viewing it to edit it inline, or go to your documents list and use the three-dot menu next to the document to select 'Rename'.",
    keywords: ["rename", "title", "name", "change"],
  },
];

// Search English FAQ data
function searchEnglishFAQ(query: string) {
  const searchQuery = query.toLowerCase().trim();

  if (searchQuery.length < 2) {
    return [];
  }

  const matches = englishFaqData.filter((faq) => {
    const questionMatch = faq.question.toLowerCase().includes(searchQuery);
    const answerMatch = faq.answer.toLowerCase().includes(searchQuery);
    const keywordMatch = faq.keywords.some(
      (keyword) =>
        keyword.toLowerCase().includes(searchQuery) ||
        searchQuery.includes(keyword.toLowerCase())
    );

    return questionMatch || answerMatch || keywordMatch;
  });

  // Sort matches by relevance
  matches.sort((a, b) => {
    const aQuestionMatch = a.question.toLowerCase().includes(searchQuery);
    const bQuestionMatch = b.question.toLowerCase().includes(searchQuery);

    if (aQuestionMatch && !bQuestionMatch) return -1;
    if (!aQuestionMatch && bQuestionMatch) return 1;

    return 0;
  });

  return matches;
}

export const getFAQAnswer = async (req: Request, res: Response) => {
  try {
    let query: string;

    // Handle both GET and POST requests
    if (req.method === "GET") {
      query = req.query.query as string;
    } else {
      query = req.body.query as string;
    }

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required",
        message: "Please provide a question to search for",
      });
    }

    const searchQuery = query.trim();

    if (searchQuery.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Query too short",
        message: "Please provide at least 2 characters for search",
      });
    }

    console.log(
      `FAQ Query: "${searchQuery}" - Language: ${
        isVietnamese(searchQuery) ? "Vietnamese" : "English"
      }`
    );

    // Check if query is in Vietnamese
    if (isVietnamese(searchQuery)) {
      // Try to fetch from Vietnamese FAQ service
      const vietnameseAnswer = await fetchVietnameseFAQ(searchQuery);

      if (vietnameseAnswer) {
        return res.json({
          success: true,
          data: {
            query: searchQuery,
            answer: vietnameseAnswer.answer,
            language: "vi",
            source: "external",
            from_cache: vietnameseAnswer.from_cache,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Fallback response for Vietnamese queries when service is unavailable
        return res.json({
          success: true,
          data: {
            query: searchQuery,
            answer: `Xin lỗi, hiện tại dịch vụ FAQ tiếng Việt không khả dụng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ để được giúp đỡ.\n\nBạn cũng có thể thử đặt câu hỏi bằng tiếng Anh để nhận được hỗ trợ từ hệ thống FAQ cơ bản.`,
            language: "vi",
            source: "fallback",
          },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Handle English queries with local database
      const matches = searchEnglishFAQ(searchQuery);

      if (matches.length === 0) {
        return res.json({
          success: true,
          data: {
            query: searchQuery,
            answer: `I couldn't find a specific answer for "${searchQuery}". Here are some general tips:\n\n• Check our documentation for detailed guides\n• Make sure you're signed in to access all features\n• Try rephrasing your question with different keywords\n• Contact support if you need additional help\n\nCommon topics include: creating documents, sharing with collaborators, formatting text, managing permissions, and troubleshooting connection issues.`,
            language: "en",
            source: "local",
            suggestions: [
              "How do I create a new document?",
              "How do I share a document with others?",
              "How do I add comments to a document?",
              "I forgot my password, how do I reset it?",
            ],
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Format the response
      let response = "";

      if (matches.length === 1) {
        response = `**${matches[0].question}**\n\n${matches[0].answer}`;
      } else {
        response = `I found ${matches.length} relevant answers for "${searchQuery}":\n\n`;
        matches.slice(0, 3).forEach((match, index) => {
          response += `**${index + 1}. ${match.question}**\n${
            match.answer
          }\n\n`;
        });

        if (matches.length > 3) {
          response += `And ${
            matches.length - 3
          } more related topics. Try being more specific for better results.`;
        }
      }

      return res.json({
        success: true,
        data: {
          query: searchQuery,
          answer: response,
          language: "en",
          source: "local",
          matches: matches.map((match) => ({
            question: match.question,
            answer: match.answer,
          })),
          totalMatches: matches.length,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("FAQ API Error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while searching FAQ. Please try again.",
      timestamp: new Date().toISOString(),
    });
  }
};
