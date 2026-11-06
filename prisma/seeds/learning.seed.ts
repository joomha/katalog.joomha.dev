import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type QuestionSeed = { prompt: string; options: string[]; correct: number; explanation?: string };
type LessonSeed = { title: string; slug: string; body: string };
type ChapterSeed = { title: string; slug: string; lessons: LessonSeed[] };

const EXCEL_CHAPTERS: ChapterSeed[] = [
  {
    title: "Pengenalan Lingkungan Kerja Excel", slug: "pengenalan-lingkungan-kerja-excel",
    lessons: [
      { title: "Mengenal Workbook, Worksheet, dan Cell", slug: "workbook-worksheet-cell", body: "Excel menyimpan pekerjaan dalam workbook. Satu workbook dapat memiliki beberapa worksheet. Worksheet tersusun dari kolom berhuruf dan baris bernomor; perpotongan keduanya disebut cell. Alamat B3 berarti kolom B dan baris 3. Cell dapat berisi teks, angka, tanggal, atau formula." },
      { title: "Tipe Data dan Format Cell", slug: "tipe-data-format-cell", body: "Tipe data umum meliputi teks, angka, tanggal, dan formula. Format cell memengaruhi cara nilai ditampilkan. Number untuk angka, Currency untuk nilai uang, Date untuk tanggal, dan Text untuk kode yang harus mempertahankan nol di depan seperti 00125." },
      { title: "Navigasi dan Pintasan Keyboard", slug: "navigasi-pintasan-keyboard", body: "Gunakan tombol panah untuk berpindah cell, Ctrl+panah untuk menuju tepi area data, Ctrl+C dan Ctrl+V untuk menyalin/menempel, Ctrl+Z untuk membatalkan, dan Ctrl+S untuk menyimpan. Pintasan dapat berbeda menurut sistem operasi dan versi Excel." },
    ],
  },
  {
    title: "Kalkulasi dan Rumus Dasar", slug: "kalkulasi-rumus-dasar",
    lessons: [
      { title: "Operator Aritmetika dan Formula", slug: "operator-aritmetika-formula", body: "Formula Excel diawali tanda sama dengan (=). Operator dasar adalah penjumlahan (+), pengurangan (-), perkalian (*), pembagian (/), dan pangkat (^). Gunakan tanda kurung agar prioritas operasi jelas. Contoh: =(A2+B2)*C2." },
      { title: "Fungsi SUM, AVERAGE, MIN, dan MAX", slug: "fungsi-sum-average-min-max", body: "SUM menjumlahkan nilai, AVERAGE menghitung rata-rata, MIN mencari nilai terkecil, dan MAX mencari nilai terbesar. Contoh: =SUM(B2:B10), =AVERAGE(B2:B10), =MIN(B2:B10), dan =MAX(B2:B10)." },
      { title: "Referensi Relatif dan Absolut", slug: "referensi-relatif-absolut", body: "Referensi relatif seperti A1 berubah ketika formula disalin. Referensi absolut seperti $A$1 tetap menunjuk cell yang sama. Referensi campuran seperti $A1 atau A$1 mengunci kolom atau baris saja. Tekan F4 saat mengedit referensi untuk mengganti jenis penguncian." },
    ],
  },
  {
    title: "Logika Dasar dan Pembuatan Grafik", slug: "logika-dasar-pembuatan-grafik",
    lessons: [
      { title: "Fungsi IF Tunggal", slug: "fungsi-if-tunggal", body: "Fungsi IF menguji kondisi dan mengembalikan nilai ketika kondisi benar atau salah. Bentuk umum: =IF(kondisi; nilai_jika_benar; nilai_jika_salah). Pemisah argumen bisa berupa koma atau titik koma sesuai pengaturan regional Excel." },
      { title: "Conditional Formatting", slug: "conditional-formatting", body: "Conditional Formatting memberi format otomatis berdasarkan aturan. Contohnya menyorot angka di bawah target, menandai duplikasi, atau menampilkan data bar untuk membandingkan nilai. Pilih rentang data, buka Home, lalu Conditional Formatting dan tentukan rule." },
      { title: "Membuat Chart yang Mudah Dibaca", slug: "membuat-chart", body: "Pilih data dan labelnya, lalu gunakan Insert untuk membuat chart. Column chart cocok membandingkan kategori, line chart untuk tren waktu, dan pie chart untuk komposisi sederhana. Tambahkan judul dan label yang jelas serta hindari elemen dekoratif yang tidak membantu pembacaan." },
    ],
  },
];

const QUESTIONS: Record<string, QuestionSeed[]> = {
  pretest: [
    { prompt: "Alamat cell pada perpotongan kolom B dan baris 3 adalah ...", options: ["3B", "B3", "BB3", "B:3"], correct: 1 },
    { prompt: "Tanda untuk memulai formula Excel adalah ...", options: ["+", "=", "#", "@"], correct: 1 },
    { prompt: "Fungsi untuk menghitung rata-rata adalah ...", options: ["SUM", "COUNT", "AVERAGE", "MAX"], correct: 2 },
  ],
  ch1: [
    { prompt: "Kumpulan worksheet dalam satu file Excel disebut ...", options: ["Workbook", "Cell", "Range", "Formula"], correct: 0 },
    { prompt: "Format Text berguna untuk ...", options: ["Menjumlahkan nilai", "Mempertahankan kode seperti 00125", "Membuat grafik", "Mengurutkan baris"], correct: 1 },
    { prompt: "Shortcut untuk menyimpan workbook adalah ...", options: ["Ctrl+X", "Ctrl+S", "Ctrl+F", "Ctrl+N"], correct: 1 },
  ],
  ch2: [
    { prompt: "Formula untuk mencari nilai terbesar pada C2 sampai C9 adalah ...", options: ["=MIN(C2:C9)", "=MAX(C2:C9)", "=SUM(C2:C9)", "=AVG(C2:C9)"], correct: 1 },
    { prompt: "Referensi $B$4 merupakan referensi ...", options: ["Relatif", "Campuran", "Absolut", "Eksternal"], correct: 2 },
    { prompt: "Operator perkalian pada formula Excel adalah ...", options: ["x", "*", "/", "^"], correct: 1 },
  ],
  ch3: [
    { prompt: "Fungsi yang menghasilkan nilai berdasarkan kondisi adalah ...", options: ["SUM", "IF", "MIN", "COUNT"], correct: 1 },
    { prompt: "Fitur pemformatan otomatis berdasarkan aturan adalah ...", options: ["Conditional Formatting", "Data Validation", "Freeze Panes", "Page Layout"], correct: 0 },
    { prompt: "Chart untuk membandingkan beberapa kategori adalah ...", options: ["Column", "Line", "Scatter", "Surface"], correct: 0 },
  ],
  final: [
    { prompt: "Satu workbook dapat berisi beberapa ...", options: ["Worksheet", "Database server", "Operating system", "Browser"], correct: 0 },
    { prompt: "Alamat cell pada kolom C baris 5 adalah ...", options: ["5C", "C5", "C:5", "CC5"], correct: 1 },
    { prompt: "Formula perkalian A2 dengan B2 adalah ...", options: ["=A2xB2", "=A2*B2", "=MULTIPLY(A2,B2)", "=A2/B2"], correct: 1 },
    { prompt: "Fungsi untuk nilai terkecil adalah ...", options: ["MAX", "MIN", "SUM", "IF"], correct: 1 },
    { prompt: "Referensi absolut untuk A1 ditulis ...", options: ["A1", "$A1", "A$1", "$A$1"], correct: 3 },
    { prompt: "Hasil =AVERAGE(10;20;30) adalah ...", options: ["10", "20", "30", "60"], correct: 1 },
    { prompt: "Fungsi IF digunakan untuk ...", options: ["Menguji kondisi", "Mengurutkan", "Menggambar chart", "Menghapus data"], correct: 0 },
    { prompt: "Conditional Formatting bekerja berdasarkan ...", options: ["Aturan", "Password", "Nama workbook", "Ukuran file"], correct: 0 },
    { prompt: "Line chart paling tepat untuk ...", options: ["Tren waktu", "Satu nilai teks", "Alamat cell", "Daftar formula"], correct: 0 },
    { prompt: "Shortcut untuk membatalkan tindakan terakhir adalah ...", options: ["Ctrl+Z", "Ctrl+S", "Ctrl+C", "Ctrl+P"], correct: 0 },
  ],
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
function optionRows(question: QuestionSeed) {
  return question.options.map((label, index) => ({
    optionKey: String.fromCharCode(65 + index), label, isCorrect: index === question.correct, displayOrder: index,
  }));
}
async function seedAssessment(input: {
  courseId: string; chapterId?: string; lessonId?: string;
  stage: "PRETEST" | "POSTTEST" | "CHAPTER_EXAM" | "FINAL_EXAM";
  title: string; questions: QuestionSeed[]; isRequired: boolean;
}) {
  const existing = await prisma.assessment.findFirst({
    where: {
      courseId: input.courseId, chapterId: input.chapterId ?? null, lessonId: input.lessonId ?? null,
      stage: input.stage, title: input.title,
    },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.assessment.create({
    data: {
      courseId: input.courseId, chapterId: input.chapterId, lessonId: input.lessonId,
      stage: input.stage, title: input.title,
      instructions: "Baca setiap pertanyaan dan pilih jawaban yang paling tepat.",
      passingScore: 70, maxAttempts: 3, timeLimitSeconds: input.stage === "FINAL_EXAM" ? 900 : 300,
      retryCooldownSeconds: 30, shuffleQuestions: true, shuffleOptions: true,
      showExplanation: true, allowReview: true, isRequired: input.isRequired, isPublished: true,
      questions: { create: input.questions.map((question, index) => ({
        type: "SINGLE_CHOICE", prompt: question.prompt, points: 1, displayOrder: index,
        explanation: question.explanation,
        options: { create: optionRows(question) },
      })) },
    },
  });
}
async function seedLesson(chapterId: string, lesson: LessonSeed, order: number, publish: boolean) {
  const row = await prisma.lesson.upsert({
    where: { chapterId_slug: { chapterId, slug: lesson.slug } },
    update: { title: lesson.title, description: lesson.body, displayOrder: order, isRequired: true, isPublished: publish },
    create: {
      chapterId, title: lesson.title, slug: lesson.slug, description: lesson.body,
      displayOrder: order, isRequired: true, isPublished: publish,
    },
  });
  if (publish) {
    const block = await prisma.lessonContentBlock.findFirst({
      where: { lessonId: row.id, type: "TEXT", title: lesson.title }, select: { id: true },
    });
    if (!block) {
      await prisma.lessonContentBlock.create({
        data: { lessonId: row.id, type: "TEXT", title: lesson.title, body: lesson.body, displayOrder: 0, isRequired: true },
      });
    }
  }
  return row;
}

async function seedExcelDemo(courseId: string) {
  const chapters: Array<{ id: string }> = [];
  const lessons: Array<{ id: string; chapterId: string; chapterIndex: number; lessonIndex: number }> = [];
  for (let chapterIndex = 0; chapterIndex < EXCEL_CHAPTERS.length; chapterIndex++) {
    const seed = EXCEL_CHAPTERS[chapterIndex];
    const chapter = await prisma.courseChapter.upsert({
      where: { courseId_slug: { courseId, slug: seed.slug } },
      update: {
        title: seed.title, displayOrder: chapterIndex, isRequired: true, isPublished: true,
        gatePolicy: { pretestRequiredBeforeLessons: false, requireAllLessonsCompleted: true, requireChapterExamPassed: true } as Prisma.InputJsonValue,
      },
      create: {
        courseId, title: seed.title, slug: seed.slug, displayOrder: chapterIndex, isRequired: true, isPublished: true,
        gatePolicy: { pretestRequiredBeforeLessons: false, requireAllLessonsCompleted: true, requireChapterExamPassed: true } as Prisma.InputJsonValue,
      },
    });
    chapters.push({ id: chapter.id });
    for (let lessonIndex = 0; lessonIndex < seed.lessons.length; lessonIndex++) {
      const lesson = await seedLesson(chapter.id, seed.lessons[lessonIndex], lessonIndex, true);
      lessons.push({ id: lesson.id, chapterId: chapter.id, chapterIndex, lessonIndex });
    }
  }

  await seedAssessment({ courseId, chapterId: chapters[0].id, stage: "PRETEST", title: "Pretest Diagnostik — Excel Basic", questions: QUESTIONS.pretest, isRequired: false });
  await seedAssessment({ courseId, chapterId: chapters[0].id, stage: "CHAPTER_EXAM", title: "Ujian Chapter 1 — Dasar Excel", questions: QUESTIONS.ch1, isRequired: true });
  await seedAssessment({ courseId, chapterId: chapters[1].id, stage: "CHAPTER_EXAM", title: "Ujian Chapter 2 — Rumus Dasar", questions: QUESTIONS.ch2, isRequired: true });
  await seedAssessment({ courseId, chapterId: chapters[2].id, stage: "CHAPTER_EXAM", title: "Ujian Chapter 3 — Logika dan Grafik", questions: QUESTIONS.ch3, isRequired: true });
  for (const lesson of lessons) {
    const q = lesson.chapterIndex === 0
      ? { prompt: "Perpotongan baris dan kolom disebut ...", options: ["Cell", "Workbook", "Chart"], correct: 0 }
      : lesson.chapterIndex === 1
        ? { prompt: "Fungsi untuk menghitung rata-rata adalah ...", options: ["SUM", "AVERAGE", "MAX"], correct: 1 }
        : { prompt: "Fitur untuk menerapkan format berdasarkan aturan adalah ...", options: ["Sort", "Conditional Formatting", "Find"], correct: 1 };
    await seedAssessment({
      courseId, chapterId: lesson.chapterId, lessonId: lesson.id, stage: "POSTTEST",
      title: "Posttest — " + EXCEL_CHAPTERS[lesson.chapterIndex].lessons[lesson.lessonIndex].title,
      questions: [q], isRequired: true,
    });
  }
  await seedAssessment({ courseId, stage: "FINAL_EXAM", title: "Final Exam — Microsoft Excel Basic", questions: QUESTIONS.final, isRequired: true });

  const gameSeeds: Array<{
    slug: string; type: "CROSSWORD" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MATCHING_PAIRS" | "WORD_SCRAMBLE" | "FILL_IN_THE_BLANK" | "FLASHCARDS" | "ORDERING" | "TIMED_CHALLENGE";
    title: string; instructions: string; chapterIndex: number; lessonIndex: number; required: boolean; config: Record<string, unknown>;
  }> = [
    { slug: "tts-istilah-excel", type: "CROSSWORD", title: "TTS Istilah Excel", instructions: "Baca petunjuk dan masukkan istilah tanpa spasi.", chapterIndex: 0, lessonIndex: 0, required: true,
      config: { rows: 8, columns: 8, entries: [
        { id: "e1", number: 1, direction: "ACROSS", row: 0, column: 0, answer: "CELL", clue: "Perpotongan baris dan kolom." },
        { id: "e2", number: 2, direction: "DOWN", row: 2, column: 3, answer: "DATA", clue: "Informasi yang diolah." },
      ] } },
    { slug: "kuis-fungsi-excel", type: "MULTIPLE_CHOICE", title: "Kuis Fungsi Excel", instructions: "Pilih jawaban yang paling tepat.", chapterIndex: 1, lessonIndex: 1, required: true,
      config: { questions: [{ id: "q1", prompt: "Fungsi untuk menghitung rata-rata adalah?", options: [{ id: "a", text: "SUM" }, { id: "b", text: "AVERAGE" }, { id: "c", text: "MAX" }], correctOptionId: "b" }] } },
    { slug: "benar-salah-workbook", type: "TRUE_FALSE", title: "Benar atau Salah: Workbook", instructions: "Tentukan benar atau salah.", chapterIndex: 0, lessonIndex: 1, required: false,
      config: { questions: [{ id: "q1", statement: "Satu workbook dapat berisi beberapa worksheet.", correctAnswer: true }] } },
    { slug: "pasangkan-fungsi", type: "MATCHING_PAIRS", title: "Pasangkan Fungsi Excel", instructions: "Cocokkan nama fungsi dengan kegunaannya.", chapterIndex: 1, lessonIndex: 1, required: false,
      config: { pairs: [{ id: "sum", left: "SUM", right: "Menjumlahkan nilai" }, { id: "avg", left: "AVERAGE", right: "Menghitung rata-rata" }, { id: "max", left: "MAX", right: "Mencari nilai terbesar" }], shuffleRight: true } },
    { slug: "susun-istilah", type: "WORD_SCRAMBLE", title: "Susun Istilah Spreadsheet", instructions: "Susun huruf menjadi istilah yang tepat.", chapterIndex: 0, lessonIndex: 2, required: false,
      config: { words: [{ id: "cell", clue: "Perpotongan baris dan kolom.", answer: "CELL" }, { id: "book", clue: "File kerja Excel.", answer: "WORKBOOK" }] } },
    { slug: "lengkapi-rumus", type: "FILL_IN_THE_BLANK", title: "Lengkapi Rumus", instructions: "Isi istilah yang hilang.", chapterIndex: 1, lessonIndex: 0, required: false,
      config: { prompts: [{ id: "p1", sentence: "Formula Excel dimulai dengan tanda ____.", acceptedAnswers: ["="] }] } },
    { slug: "flashcards-excel", type: "FLASHCARDS", title: "Flashcards Istilah Excel", instructions: "Pelajari kartu dan tandai penguasaan.", chapterIndex: 0, lessonIndex: 1, required: false,
      config: { cards: [{ id: "f1", front: "Apa itu cell?", back: "Perpotongan satu baris dan satu kolom." }, { id: "f2", front: "Apa fungsi SUM?", back: "Menjumlahkan angka dalam argumen atau rentang." }], allowSelfRating: true } },
    { slug: "urutkan-langkah-chart", type: "ORDERING", title: "Urutkan Langkah Membuat Chart", instructions: "Susun ID langkah sesuai urutan.", chapterIndex: 2, lessonIndex: 2, required: false,
      config: { items: [{ id: "select", text: "Pilih data dan label", correctPosition: 1 }, { id: "insert", text: "Buka menu Insert", correctPosition: 2 }, { id: "type", text: "Pilih jenis chart", correctPosition: 3 }, { id: "review", text: "Periksa judul dan label", correctPosition: 4 }] } },
    { slug: "tantangan-cepat", type: "TIMED_CHALLENGE", title: "Tantangan Cepat Excel", instructions: "Jawab sebelum waktu habis.", chapterIndex: 2, lessonIndex: 1, required: false,
      config: { timeLimitSeconds: 60, questions: [{ id: "t1", prompt: "Fungsi untuk nilai terkecil?", options: [{ id: "a", text: "MIN" }, { id: "b", text: "MAX" }], correctOptionId: "a" }] } },
  ];
  for (const seed of gameSeeds) {
    const lesson = lessons.find((row) => row.chapterIndex === seed.chapterIndex && row.lessonIndex === seed.lessonIndex)!;
    await prisma.learningGame.upsert({
      where: { courseId_slug: { courseId, slug: seed.slug } },
      update: {
        title: seed.title, instructions: seed.instructions, type: seed.type,
        config: seed.config as Prisma.InputJsonValue, isRequired: seed.required, isPublished: true,
      },
      create: {
        courseId, chapterId: lesson.chapterId, lessonId: lesson.id, slug: seed.slug, type: seed.type,
        title: seed.title, instructions: seed.instructions, config: seed.config as Prisma.InputJsonValue,
        scoringPolicy: { pointsPerCorrect: 10, passingScore: 70, penalizeWrongAnswer: false } as Prisma.InputJsonValue,
        isRequired: seed.required, isPublished: true,
      },
    });
  }

  const lastLesson = lessons.find((row) => row.chapterIndex === 2 && row.lessonIndex === 2)!;
  const assignment = await prisma.learningAssignment.findFirst({ where: { courseId, title: "Praktik Akhir — Laporan Penjualan Sederhana" }, select: { id: true } });
  if (!assignment) {
    await prisma.learningAssignment.create({
      data: {
        courseId, chapterId: lastLesson.chapterId, lessonId: lastLesson.id,
        title: "Praktik Akhir — Laporan Penjualan Sederhana",
        description: "Buat lembar kerja yang merangkum data penjualan contoh.",
        instructions: "Buat workbook dengan minimal 10 baris data contoh. Hitung total dan rata-rata menggunakan formula, gunakan IF untuk memberi label target, lalu sertakan satu chart yang sesuai. Kumpulkan file latihan dan jelaskan formula yang digunakan.",
        maxScore: 100, dueAfterDays: 14, allowLateSubmission: true, isRequired: true, isPublished: true,
      },
    });
  }
}

export async function seedLearning() {
  const items = await prisma.catalogItem.findMany({
    where: { type: "SELF_PACED_COURSE" }, orderBy: { title: "asc" },
  });
  let courses = 0; let chapters = 0; let lessons = 0;
  for (const item of items) {
    const demo = item.slug === "microsoft-excel-basic";
    const course = await prisma.course.upsert({
      where: { catalogItemId: item.id },
      update: {
        title: item.title, shortDescription: item.shortDescription, description: item.description,
        level: item.level, learningOutcomes: item.learningOutcomes, prerequisites: item.prerequisites,
      },
      create: {
        catalogItemId: item.id, slug: item.slug, title: item.title,
        shortDescription: item.shortDescription, description: item.description,
        status: demo ? "DRAFT" : "COMING_SOON",
        enrollmentMode: "PAID", level: item.level,
        learningOutcomes: item.learningOutcomes, prerequisites: item.prerequisites,
        certificateEnabled: true,
        certificatePolicy: {
          finalExamRequired: true, finalExamPassingScore: 70,
          minimumProgressPercentage: 100, requiredAssignments: demo,
        } as Prisma.InputJsonValue,
      },
    });
    courses++;
    if (demo) {
      await seedExcelDemo(course.id); chapters += 3; lessons += 9;
      continue;
    }
    const summary = Array.isArray(item.curriculumSummary)
      ? item.curriculumSummary as unknown as Array<{ title: string; topics: string[] }>
      : [];
    for (let i = 0; i < summary.length; i++) {
      const entry = summary[i]; const slug = slugify(entry.title) || "chapter-" + (i + 1);
      const chapter = await prisma.courseChapter.upsert({
        where: { courseId_slug: { courseId: course.id, slug } },
        update: { title: entry.title, description: entry.topics.join(" • "), displayOrder: i, isPublished: false },
        create: {
          courseId: course.id, title: entry.title, slug,
          description: entry.topics.join(" • "), displayOrder: i, isRequired: true, isPublished: false,
          gatePolicy: { pretestRequiredBeforeLessons: false, requireAllLessonsCompleted: true, requireChapterExamPassed: true } as Prisma.InputJsonValue,
        },
      });
      chapters++;
      for (let j = 0; j < entry.topics.length; j++) {
        const title = entry.topics[j]; const lessonSlug = slugify(title) || "lesson-" + (j + 1);
        await prisma.lesson.upsert({
          where: { chapterId_slug: { chapterId: chapter.id, slug: lessonSlug } },
          update: { title, displayOrder: j, isPublished: false },
          create: {
            chapterId: chapter.id, title, slug: lessonSlug,
            description: "Kerangka materi awal untuk topik " + title + ". Konten lengkap perlu ditambahkan dan ditinjau instruktur.",
            displayOrder: j, isRequired: true, isPublished: false,
          },
        });
        lessons++;
      }
    }
  }
  console.log("Learning seed complete:", { courses, chapters, lessons });
}

if (process.argv[1]?.includes("learning.seed")) {
  seedLearning()
    .catch((error) => { console.error("Learning seed failed:", error); process.exitCode = 1; })
    .finally(async () => { await prisma.$disconnect(); });
}
