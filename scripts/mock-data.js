const icon = (fileName) =>
  new URL(`../assets/images/${fileName}`, import.meta.url).href;

export const teachers = [
  {
    id: 1,
    name: "Mr Sammy",
    contact: "0721859532",
    email: "sammy@esoma.com",

    assignments: [
      { id: 5101, subjectId: "MAT", classId: 12, role: "Main" },
      { id: 5102, subjectId: "MAT", classId: 11, role: "Main" },
      { id: 5103, subjectId: "MAT", classId: 10, role: "Co-Teacher" },
      { id: 5104, subjectId: "MAT", classId: 9, role: "Assistant" },
      { id: 5105, subjectId: "SCI", classId: 11, role: "Main" },
      { id: 5106, subjectId: "SCI", classId: 3, role: "Main" },
      { id: 5107, subjectId: "SCI", classId: 8, role: "Assistant" },
      { id: 5108, subjectId: "ENG", classId: 3, role: "Assistant" },
      { id: 5109, subjectId: "ENG", classId: 4, role: "Main" },
      { id: 5110, subjectId: "ENG", classId: 5, role: "Co-Teacher" },
      { id: 5111, subjectId: "KIS", classId: 12, role: "Main" },
      { id: 5112, subjectId: "KIS", classId: 1, role: "Temporary" },
      { id: 5113, subjectId: "CRE", classId: 11, role: "Temporary" },
      { id: 5114, subjectId: "CRE", classId: 6, role: "Main" },
      { id: 5115, subjectId: "ART", classId: 3, role: "Assistant" },
      { id: 5116, subjectId: "ART", classId: 7, role: "Main" },
      { id: 5117, subjectId: "ENV", classId: 12, role: "Main" },
      { id: 5118, subjectId: "ENV", classId: 13, role: "Co-Teacher" }
    ]

  },

  {
    id: 2,
    name: "Mrs Jane",
    contact: "0712456789",
    email: "jane@esoma.com",

    assignments: [
      {
        id: 5008,
        subjectId: "ENG",
        classId: 10,
        role: "Main"
      },
      {
        id: 5009,
        subjectId: "LIT",
        classId: 9,
        role: "Co-Teacher"
      }
    ]

  },

  {
    id: 3,
    name: "Mr David",
    contact: "0722345678",
    email: "david@esoma.com",

    assignments: [
      {
        id: 5010,
        subjectId: "SCI",
        classId: 8,
        role: "Main"
      },
      {
        id: 5011,
        subjectId: "BIO",
        classId: 7,
        role: "Assistant"
      }
    ]
  },

  {
    id: 4,
    name: "Ms Sarah",
    contact: "0733456789",
    email: "sarah@esoma.com",
    assignments: [
      {
        id: 5012,
        subjectId: "SS",
        classId: 6,
        role: "Main"
      },
      {
        id: 5013,
        subjectId: "GEO",
        classId: 5,
        role: "Temporary"
      }
    ]

  },

  {
    id: 5,
    name: "Mr Peter",
    contact: "0744567890",
    email: "peter@esoma.com",
    assignments: [
      {
        id: 5014,
        subjectId: "COMP",
        classId: 12,
        role: "Main"
      },
      {
        id: 5015,
        subjectId: "COMP",
        classId: 11,
        role: "Co-Teacher"
      }
    ]

  },

  {
    id: 6,
    name: "Mrs Emily",
    contact: "0755678901",
    email: "emily@esoma.com",

    assignments: [
      {
        id: 5016,
        subjectId: "MAT",
        classId: 10,
        role: "Main"
      },
      {
        id: 5017,
        subjectId: "PHY",
        classId: 9,
        role: "Assistant"
      }
    ]

  },

  {
    id: 7,
    name: "Mr Joseph",
    contact: "0766789012",
    email: "joseph@esoma.com",

    assignments: [
      {
        id: 5018,
        subjectId: "BIO",
        classId: 12,
        role: "Main"
      },
      {
        id: 5019,
        subjectId: "CHEM",
        classId: 1,
        role: "Temporary"
      }
    ]

  }
];


export const classes = [
  { id: 1, name: "PP1 North", group: "PP1", theme: "pp1", students: 22 },
  { id: 3, name: "PP2 North East", group: "PP2", theme: "pp2", students: 25 },
  { id: 4, name: "Grade 1 North", group: "Grade 1", theme: "grade-1", students: 26 },
  { id: 5, name: "Grade 2 North East", group: "Grade 2", theme: "grade-2", students: 31 },
  { id: 6, name: "Grade 3 East", group: "Grade 3", theme: "grade-3", students: 28 },
  { id: 7, name: "Grade 4 North", group: "Grade 4", theme: "grade-4", students: 30 },
  { id: 8, name: "Grade 5 South", group: "Grade 5", theme: "grade-5", students: 29 },
  { id: 9, name: "Grade 6 West", group: "Grade 6", theme: "grade-6", students: 27 },
  { id: 10, name: "Grade 7 Central", group: "Grade 7", theme: "grade-7", students: 34 },
  { id: 11, name: "Grade 8 South", group: "Grade 8", theme: "grade-8", students: 32 },
  { id: 12, name: "Grade 9 North", group: "Grade 9", theme: "grade-9", students: 33 },
  { id: 13, name: "Grade 1 East", group: "Grade 1", theme: "grade-1", students: 25 },
  { id: 14, name: "Grade 5 West", group: "Grade 5", theme: "grade-5", students: 24 }
];

// Students are organised around the logged-in teacher (Mr Sammy), who teaches
// PP2 North East (3), Grade 8 South (11) and Grade 9 North (12). Every class he
// is assigned to has real students so the dashboard totals and class pages are
// never empty. A few students from other classes are kept for variety.
const students = [
  // PP2 North East (classId 3) — Mr Sammy: English, Creative Arts & Sports
  { id: 1001, name: "Baraka Otieno",    classId: 3, admissionNo: "EA-2026-PP2-001", status: "active",  invite: "Accepted" },
  { id: 1002, name: "Zawadi Achieng",   classId: 3, admissionNo: "EA-2026-PP2-002", status: "active",  invite: "Accepted" },
  { id: 1003, name: "Imani Wanjiru",    classId: 3, admissionNo: "EA-2026-PP2-003", status: "pending", invite: "Pending"  },
  { id: 1004, name: "Jayden Kiprono",   classId: 3, admissionNo: "EA-2026-PP2-004", status: "active",  invite: "Accepted" },
  { id: 1005, name: "Neema Mwikali",    classId: 3, admissionNo: "EA-2026-PP2-005", status: "active",  invite: "Accepted" },
  { id: 1006, name: "Tevin Omondi",     classId: 3, admissionNo: "EA-2026-PP2-006", status: "pending", invite: "Pending"  },

  // Grade 8 South (classId 11) — Mr Sammy: Science & Technology, CRE
  { id: 1007, name: "Brian Kiptoo",     classId: 11, admissionNo: "EA-2026-G8-001", status: "active",  invite: "Accepted" },
  { id: 1008, name: "Faith Atieno",     classId: 11, admissionNo: "EA-2026-G8-002", status: "active",  invite: "Accepted" },
  { id: 1009, name: "Dennis Mwangi",    classId: 11, admissionNo: "EA-2026-G8-003", status: "active",  invite: "Accepted" },
  { id: 1010, name: "Joan Wanjiku",     classId: 11, admissionNo: "EA-2026-G8-004", status: "pending", invite: "Pending"  },
  { id: 1011, name: "Kevin Muli",       classId: 11, admissionNo: "EA-2026-G8-005", status: "active",  invite: "Accepted" },
  { id: 1012, name: "Mercy Jepkoech",   classId: 11, admissionNo: "EA-2026-G8-006", status: "active",  invite: "Accepted" },
  { id: 1013, name: "Victor Maina",     classId: 11, admissionNo: "EA-2026-G8-007", status: "pending", invite: "Pending"  },

  // Grade 9 North (classId 12) — Mr Sammy: Mathematics, Kiswahili, Environmental
  { id: 1014, name: "Sharon Cheruiyot", classId: 12, admissionNo: "EA-2026-G9-001", status: "active",  invite: "Accepted" },
  { id: 1015, name: "Caleb Mutua",      classId: 12, admissionNo: "EA-2026-G9-002", status: "active",  invite: "Accepted" },
  { id: 1016, name: "Grace Naliaka",    classId: 12, admissionNo: "EA-2026-G9-003", status: "active",  invite: "Accepted" },
  { id: 1017, name: "Eric Kiplangat",   classId: 12, admissionNo: "EA-2026-G9-004", status: "pending", invite: "Pending"  },
  { id: 1018, name: "Faith Nyambura",   classId: 12, admissionNo: "EA-2026-G9-005", status: "active",  invite: "Accepted" },
  { id: 1019, name: "Abel Musyoka",     classId: 12, admissionNo: "EA-2026-G9-006", status: "active",  invite: "Accepted" },
  { id: 1020, name: "Christine Atieno", classId: 12, admissionNo: "EA-2026-G9-007", status: "active",  invite: "Accepted" },
  { id: 1021, name: "John Mwenda",      classId: 12, admissionNo: "EA-2026-G9-008", status: "pending", invite: "Pending"  },

  // A few students from other classes (not Mr Sammy's) for variety
  { id: 1022, name: "Sarah Chepkemoi",  classId: 10, admissionNo: "EA-2026-G7-001", status: "active",  invite: "Accepted" },

  // Shared with the admin app (same people in both portals)
  { id: 1023, name: "Timothy Kamau",    classId: 4,  admissionNo: "EA-2026-G1-001", status: "pending", invite: "Accepted" },
  { id: 1024, name: "Amani Yusuf",      classId: 12, admissionNo: "EA-2026-G9-009", status: "active",  invite: "Accepted" },
  { id: 1025, name: "Nia Joy",          classId: 11, admissionNo: "EA-2026-G8-008", status: "active",  invite: "Accepted" },
  { id: 1026, name: "Zacharia Muteti",  classId: 3,  admissionNo: "EA-2026-PP2-007", status: "pending", invite: "Pending" }
];

// Parent/guardian details live directly on the student records (single source
// of truth) so the profile can read them instead of inventing data each time.
const guardianInfo = {
  1001: ["Joseph Otieno", "0722 145 880"],
  1002: ["Mary Achieng", "0723 410 552"],
  1003: ["Peter Wanjiru", "0701 938 274"],
  1004: ["Grace Kiprono", "0712 664 109"],
  1005: ["Daniel Mwikali", "0733 215 487"],
  1006: ["Esther Omondi", "0720 877 360"],
  1007: ["Samuel Kiptoo", "0711 502 943"],
  1008: ["Lucy Atieno", "0729 138 705"],
  1009: ["James Mwangi", "0700 461 829"],
  1010: ["Ann Wanjiku", "0743 920 158"],
  1011: ["Charles Muli", "0758 374 612"],
  1012: ["Rose Jepkoech", "0707 285 490"],
  1013: ["David Maina", "0721 609 733"],
  1014: ["Faith Cheruiyot", "0734 118 256"],
  1015: ["Paul Mutua", "0768 540 921"],
  1016: ["Mercy Naliaka", "0719 803 467"],
  1017: ["Stephen Kiplangat", "0726 357 084"],
  1018: ["Caroline Nyambura", "0702 691 538"],
  1019: ["Patrick Musyoka", "0715 240 976"],
  1020: ["Susan Atieno", "0738 562 310"],
  1021: ["Michael Mwenda", "0709 487 651"],
  1022: ["Janet Chepkemoi", "0747 130 829"],
  // Guardians below match the admin app's records for the shared students
  1023: ["Kevin Kamau", "0721859532"],
  1024: ["Abdi Rahim", "0712456789"],
  1025: ["James Otieno", "0799555123"],
  1026: ["Jamain Mutati", "0721859532"],
};
students.forEach((student) => {
  const info = guardianInfo[student.id];
  if (info) {
    student.guardian = info[0];
    student.guardianContact = info[1];
  }
});

const subjects = [
  {
    id: "SCI",
    name: "Science and Technology",
    icon: icon("science_tech.webp"),
  },
  {
    id: "KIS",
    name: "Kiswahili",
    icon: icon("kiswahili.webp"),
    
  },
  {
    id: "MAT",
    name: "Mathematics",
    icon: icon("mathematics.webp"),
    
  },
  {
    id: "INT",
    name: "Integrated Science",
    icon: icon("integrated_sci.webp"),
   
  },
  {
    id: "COMP",
    name: "Computer Studies",
    icon: icon("computer_studies.webp"),
    
  },
  {
    id: "CRE",
    name: "Christian Religious Education",
    icon: icon("cre.webp"),
    
  },
  {
    id: "ART",
    name: "Creative Arts and Sports",
    icon: icon("creative_arts.webp"),
    
  },
  {
    id: "IRE",
    name: "Islam Religious Education",
    icon: icon("ire.webp"),
   
  },
  {
    id: "ENV",
    name: "Enviromental Activities",
    icon: icon("enviromental_activities.webp"),
    
  },
  {
    id: "ENG",
    name: "English",
    icon: icon("english.webp"),
    
  },
  {
    id: "SS",
    name: "Social Studies",
    icon: icon("social_studies.webp"),
    
  },
  {
    id: "PTECH",
    name: "Pre-Technical Studies",
    icon: icon("pre_tech.webp"),
  },

  {
    id: "AGRI",
    name: "Agriculure and Nutrition",
    icon: icon("agriculture.webp"),
    
  },
];

function makeScores(subjectId, base = 68) {
  return students.map((student, index) => ({
    studentId: student.id,
    subjectId,
    latestScore: Math.min(98, Math.max(35, base + ((index % 5) - 2) * 6)),
    trend: index % 3 === 0 ? "Improving" : index % 3 === 1 ? "Steady" : "Needs support",
  }));
}

const subjectStudentScores = {
  SCI: makeScores("SCI", 74),
  KIS: makeScores("KIS", 69),
  MAT: makeScores("MAT", 71),
  INT: makeScores("INT", 76),
  COMP: makeScores("COMP", 82),
  CRE: makeScores("CRE", 78),
  ART: makeScores("ART", 84),
};

const strandPerformance = {
  MAT: [
    {
      name: "NUMBERS",
      open: true,
      averageScore: 72,
      completion: 68,
      subStrands: [
        { name: "Whole Numbers", count: 18, averageScore: 76, completion: 72 },
        { name: "Addition", count: 8, averageScore: 69, completion: 65 },
        { name: "Subtraction", count: 8, averageScore: 71, completion: 66 },
        { name: "Multiplication", count: 9, averageScore: 64, completion: 59 },
        { name: "Division", count: 7, averageScore: 62, completion: 55 },
        { name: "Fractions", count: 7, averageScore: 78, completion: 74 },
        { name: "Decimals", count: 4, averageScore: 75, completion: 70 },
        { name: "Use of Letters", count: 0, averageScore: null, completion: 0 },
      ],
    },
    {
      name: "MEASUREMENTS",
      open: false,
      averageScore: 70,
      completion: 61,
      subStrands: [
        { name: "Length", count: 5, averageScore: 74, completion: 63 },
        { name: "Mass", count: 4, averageScore: 67, completion: 58 },
        { name: "Capacity", count: 3, averageScore: 72, completion: 64 },
        { name: "Time", count: 4, averageScore: 69, completion: 60 },
        { name: "Money", count: 6, averageScore: 71, completion: 62 },
      ],
    },
    {
      name: "GEOMETRY",
      open: false,
      averageScore: 73,
      completion: 66,
      subStrands: [
        { name: "Lines", count: 3, averageScore: 77, completion: 70 },
        { name: "Angles", count: 4, averageScore: 68, completion: 61 },
        { name: "Shapes", count: 5, averageScore: 74, completion: 68 },
      ],
    },
    {
      name: "DATA HANDLING",
      open: false,
      averageScore: 79,
      completion: 73,
      subStrands: [
        { name: "Tables", count: 3, averageScore: 80, completion: 76 },
        { name: "Pictographs", count: 2, averageScore: 78, completion: 70 },
        { name: "Bar Graphs", count: 3, averageScore: 79, completion: 74 },
      ],
    },
  ],
  SCI: [
    {
      name: "LIVING THINGS",
      open: true,
      averageScore: 77,
      completion: 71,
      subStrands: [
        { name: "Plants", count: 6, averageScore: 80, completion: 74 },
        { name: "Animals", count: 5, averageScore: 75, completion: 69 },
        { name: "Human Body", count: 4, averageScore: 76, completion: 70 },
      ],
    },
    {
      name: "MATERIALS",
      open: false,
      averageScore: 73,
      completion: 65,
      subStrands: [
        { name: "States of Matter", count: 4, averageScore: 72, completion: 66 },
        { name: "Mixtures", count: 3, averageScore: 74, completion: 64 },
      ],
    },
    {
      name: "ENERGY",
      open: false,
      averageScore: 70,
      completion: 62,
      subStrands: [
        { name: "Light", count: 3, averageScore: 73, completion: 61 },
        { name: "Heat", count: 3, averageScore: 68, completion: 60 },
        { name: "Sound", count: 2, averageScore: 69, completion: 64 },
      ],
    },
  ],
  COMP: [
    {
      name: "DIGITAL LITERACY",
      open: true,
      averageScore: 84,
      completion: 78,
      subStrands: [
        { name: "Keyboard Skills", count: 4, averageScore: 86, completion: 80 },
        { name: "File Management", count: 3, averageScore: 82, completion: 76 },
        { name: "Internet Safety", count: 5, averageScore: 85, completion: 79 },
      ],
    },
  ],
};

function defaultStrands(subjectId) {
  return strandPerformance[subjectId] || [
    {
      name: "FOUNDATION",
      open: true,
      averageScore: 74,
      completion: 66,
      subStrands: [
        { name: "Core Skills", count: 5, averageScore: 74, completion: 66 },
        { name: "Practice Tasks", count: 4, averageScore: 72, completion: 62 },
        { name: "Review", count: 3, averageScore: 76, completion: 70 },
      ],
    },
  ];
}

function buildAssignments(subjectId) {
  const strands = defaultStrands(subjectId);
  const rows = [];

  strands.forEach((strand, strandIndex) => {
    strand.subStrands.forEach((sub, subIndex) => {
      if (!sub.count) return;
      rows.push({
        id: `${subjectId}-${strandIndex}-${subIndex}`,
        name: `${sub.name} Practice ${subIndex + 1}`,
        strand: `${strand.name} - ${sub.name}`,
        deployed: `2026-06-${String(9 - ((strandIndex + subIndex) % 7)).padStart(2, "0")} 09:30:00`,
        status: sub.completion >= 70 ? "Active" : "Needs Review",
        completed: Math.round((sub.completion / 100) * 28),
        total: 28,
        average: sub.averageScore,
      });
    });
  });

  return rows;
}

function buildClassData(subjectId, classId) {
  const classStudents = students.filter((s) => Number(s.classId) === Number(classId));
  const selectedStudents = classStudents.length ? classStudents : students.slice(0, 6);
  const scores = (subjectStudentScores[subjectId] || makeScores(subjectId, 70)).filter((score) =>
    selectedStudents.some((student) => student.id === score.studentId)
  );
  const strands = defaultStrands(subjectId);
  const assignments = buildAssignments(subjectId);
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score.latestScore, 0) / scores.length)
    : 0;
  const completion = assignments.length
    ? Math.round(assignments.reduce((sum, assignment) => sum + (assignment.completed / assignment.total) * 100, 0) / assignments.length)
    : 0;

  return {
    stats: {
      totalStudents: selectedStudents.length,
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter((assignment) => assignment.status === "Active").length,
      averageScore: `${average}%`,
      completion: `${completion}%`,
    },
    students: selectedStudents.map((student) => ({
      ...student,
      score: scores.find((score) => score.studentId === student.id)?.latestScore ?? null,
      trend: scores.find((score) => score.studentId === student.id)?.trend ?? "No data",
    })),
    performance: {
      title: "Performance Overview for the Last 6 Months",
      labels: ["Jan-2026", "Feb-2026", "Mar-2026", "Apr-2026", "May-2026", "Jun-2026"],
      values: [Math.max(0, average - 22), Math.max(0, average - 16), Math.max(0, average - 10), average - 4, average - 2, average],
    },
    assignments,
    strands,
    mixedExercises: [
      { name: "Midterm 1", count: 6, averageScore: Math.max(0, average - 6), completion: Math.max(0, completion - 8) },
      { name: "Endterm 1", count: 8, averageScore: average, completion },
      { name: "Midterm 2", count: 5, averageScore: Math.max(0, average - 2), completion: Math.max(0, completion - 3) },
      { name: "Endterm 2", count: 7, averageScore: Math.min(100, average + 4), completion: Math.min(100, completion + 6) },
    ],
  };
}


export const teacherContext = {
  teacher: teachers[0],
  teachers,
  subjects,
  classes,
  students,
  subjectStudentScores,//
};

export const classDataBySubjectClass = {};//
subjects.forEach((subject) => {
  classes.forEach((klass) => {
    classDataBySubjectClass[`${subject.id}::${klass.id}`] =
      buildClassData(subject.id, klass.id);
  });
});

export function getClassMock(subjectId, classId) {
  return classDataBySubjectClass[`${subjectId}::${classId}`] || buildClassData(subjectId, classId);
}

export const classMock = getClassMock("MAT", 12);