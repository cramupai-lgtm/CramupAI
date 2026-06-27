import { QuizQuestion } from "../types";

export interface GoogleFormResponse {
  formId: string;
  responderUri: string;
}

/**
 * Programmatically creates a Google Form quiz from a list of questions,
 * configures it as a graded quiz, sets correct answers, and populates the items.
 *
 * @param accessToken Valid Google OAuth 2.0 access token with proper scopes.
 * @param title Title of the form.
 * @param questions List of QuizQuestion objects to insert.
 * @param quizType Type of quiz ("MCQ", "Fill-In-The-Blanks", or "Short Answer").
 */
export async function createGoogleFormFromQuiz(
  accessToken: string,
  title: string,
  questions: QuizQuestion[],
  quizType: "MCQ" | "Fill-In-The-Blanks" | "Short Answer"
): Promise<GoogleFormResponse> {
  // 1. Create the base Form
  const createResponse = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: {
        title: title || "AI-Generated Custom Quiz",
        description: `This interactive quiz was automatically synthesized by CramUp.ai regarding: ${title}.`,
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Failed to create base Google Form: ${errText}`);
  }

  const formData = await createResponse.json();
  const { formId, responderUri } = formData;

  if (!formId || !responderUri) {
    throw new Error("Form creation response did not contain the formId or responderUri.");
  }

  // 2. Build requests list for batchUpdate
  const requests: any[] = [];

  // Update Settings to make the form a Graded Quiz
  requests.push({
    updateSettings: {
      settings: {
        quizSettings: {
          isQuiz: true,
        },
      },
      updateMask: "quizSettings.isQuiz",
    },
  });

  // Populate questions
  questions.forEach((q, index) => {
    const isChoice = q.choices && q.choices.length > 0;

    const questionItem: any = {
      title: q.question_text,
      description: q.explanation ? `Explanation: ${q.explanation}` : "",
      questionItem: {
        question: {
          required: true,
          grading: {
            pointValue: 1,
            correctAnswers: {
              answers: [
                { value: q.correct_answer }
              ]
            }
          }
        }
      }
    };

    if (isChoice) {
      questionItem.questionItem.question.choiceQuestion = {
        type: "RADIO",
        options: q.choices.map((choice) => ({ value: choice })),
      };
    } else {
      questionItem.questionItem.question.textQuestion = {
        paragraph: quizType === "Short Answer" || q.correct_answer.length > 100,
      };
    }

    requests.push({
      createItem: {
        item: questionItem,
        location: {
          index,
        },
      },
    });
  });

  // 3. Commit changes to the Form via batchUpdate
  const batchResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests,
    }),
  });

  if (!batchResponse.ok) {
    const errText = await batchResponse.text();
    throw new Error(`Failed to populate Google Form questions & quiz settings: ${errText}`);
  }

  return {
    formId,
    responderUri,
  };
}
