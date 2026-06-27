import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  uid: text("uid").primaryKey(), // Firebase Auth UID as primary key
  email: text("email").notNull(),
  accountTier: text("account_tier").default("Free").notNull(),
  selectedSubject: text("selected_subject").default("Biology").notNull(),
  monthlyUploadsUsedCounter: integer("monthly_uploads_used_counter").default(0).notNull(),
  displayName: text("display_name"),
  autoRenew: boolean("auto_renew").default(true),
  premiumPurchasedAt: text("premium_purchased_at"),
  billingPeriod: text("billing_period").default("monthly"),
  paypalEmail: text("paypal_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.uid, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  fileType: text("file_type").notNull(),
  rawExtractedText: text("raw_extracted_text").notNull(),
  structuredSummaryMarkdown: text("structured_summary_markdown").notNull(),
  translationLanguage: text("translation_language").notNull(),
  generatedAt: text("generated_at").notNull(),
});

export const quizRecords = pgTable("quiz_records", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .references(() => materials.id, { onDelete: "cascade" })
    .notNull(),
  quizType: text("quiz_type").notNull(),
  selectedQuestionCount: integer("selected_question_count").notNull(),
  selectedChoicesPerQuestion: integer("selected_choices_per_question").notNull(),
  questions: jsonb("questions").notNull(), // JSON list of QuizQuestion objects
});

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .references(() => materials.id, { onDelete: "cascade" })
    .notNull(),
  questionFront: text("question_front").notNull(),
  answerBack: text("answer_back").notNull(),
  isCustom: boolean("is_custom").default(false),
  colorTheme: text("color_theme"),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .references(() => materials.id, { onDelete: "cascade" })
    .notNull(),
  messageSender: text("message_sender").notNull(), // "User" or "AI"
  textPayload: text("text_payload").notNull(),
  timestamp: text("timestamp").notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.uid],
  }),
  quizRecords: many(quizRecords),
  flashcards: many(flashcards),
  chatMessages: many(chatMessages),
}));

export const quizRecordsRelations = relations(quizRecords, ({ one }) => ({
  material: one(materials, {
    fields: [quizRecords.materialId],
    references: [materials.id],
  }),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  material: one(materials, {
    fields: [flashcards.materialId],
    references: [materials.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  material: one(materials, {
    fields: [chatMessages.materialId],
    references: [materials.id],
  }),
}));
