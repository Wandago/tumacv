// A broad, click-to-select skill list for Talent Hub profiles, organized
// loosely by the same industries used elsewhere (lib/gamification.js) plus
// a general/soft-skills bucket. Flat array by design — the picker filters
// it by search text rather than showing it grouped, since most people know
// what they're looking for by name.
export const SKILL_OPTIONS = [
  // Sales & Business Development
  "Sales", "B2B Sales", "B2C Sales", "Business Development", "Account Management",
  "Lead Generation", "Cold Calling", "Negotiation", "CRM (Salesforce)", "CRM (HubSpot)",
  "Sales Forecasting", "Client Relationship Management", "Upselling", "Territory Management",

  // Customer Service
  "Customer Service", "Customer Support", "Call Center Operations", "Help Desk Support",
  "Zendesk", "Live Chat Support", "Complaint Resolution", "Customer Retention",
  "Onboarding", "Ticketing Systems",

  // Administration & Office Support
  "Administration", "Office Management", "Data Entry", "Scheduling", "Records Management",
  "Front Desk / Reception", "Executive Assistance", "Minute Taking", "Procurement",
  "Microsoft Office", "Google Workspace",

  // IT & Software
  "JavaScript", "TypeScript", "Python", "Java", "PHP", "React", "Next.js", "Node.js",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Google Cloud", "Azure", "Docker",
  "Kubernetes", "CI/CD", "Git", "REST APIs", "System Administration", "Network Administration",
  "Cybersecurity", "QA / Software Testing", "Mobile Development (Android)", "Mobile Development (iOS)",
  "Data Analysis", "Data Science", "Machine Learning", "UI/UX Design", "Product Management",
  "Technical Support", "IT Helpdesk",

  // Finance & Accounting
  "Accounting", "Bookkeeping", "Financial Analysis", "Financial Reporting", "Budgeting",
  "Auditing", "Tax Compliance", "QuickBooks", "Sage", "Excel Modeling", "Payroll",
  "Accounts Payable", "Accounts Receivable", "Credit Control", "Risk Management",
  "Investment Analysis", "Bank Reconciliation",

  // Marketing & Communications
  "Digital Marketing", "SEO", "SEM / Google Ads", "Paid Social", "Content Strategy",
  "Content Writing", "Copywriting", "Social Media Management", "Email Marketing",
  "Brand Management", "Marketing Analytics", "Google Analytics", "Campaign Management",
  "Public Relations", "Media Relations", "Graphic Design (Marketing)", "Video Editing",
  "Influencer Marketing", "Market Research",

  // Engineering & Construction
  "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Structural Design",
  "AutoCAD", "Project Engineering", "Site Supervision", "Quantity Surveying",
  "Construction Management", "Building Codes & Compliance", "Surveying", "Quality Control",

  // Healthcare
  "Nursing", "Clinical Care", "Patient Care", "Pharmacy", "Medical Records",
  "Healthcare Administration", "Public Health", "Laboratory Skills", "Phlebotomy",
  "Health & Safety Compliance", "Counselling",

  // Education & Training
  "Teaching", "Curriculum Development", "Lesson Planning", "Classroom Management",
  "Training & Facilitation", "Special Needs Education", "Early Childhood Education",
  "Educational Assessment", "E-Learning Development", "Tutoring",

  // Hospitality & Tourism
  "Hospitality Management", "Front Office Operations", "Food & Beverage Service",
  "Housekeeping Management", "Event Planning", "Tour Guiding", "Travel Coordination",
  "Reservations Management", "Culinary Skills", "Menu Planning",

  // Logistics & Supply Chain
  "Supply Chain Management", "Logistics Coordination", "Inventory Management",
  "Warehouse Management", "Fleet Management", "Procurement & Sourcing", "Freight Forwarding",
  "Distribution Planning", "Demand Planning", "Import/Export Documentation",

  // Retail
  "Retail Sales", "Merchandising", "Store Management", "Point of Sale (POS) Systems",
  "Visual Merchandising", "Stock Control", "Cash Handling", "Loss Prevention",

  // Human Resources
  "Recruitment", "Talent Acquisition", "Onboarding & Induction", "Employee Relations",
  "Performance Management", "HR Policy Development", "Payroll Administration",
  "Training & Development", "HRIS Systems", "Labour Law Compliance", "Compensation & Benefits",

  // Legal
  "Legal Research", "Contract Drafting", "Compliance", "Litigation Support",
  "Corporate Governance", "Legal Documentation", "Paralegal Support", "Intellectual Property",

  // Creative & Design
  "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere Pro",
  "Figma", "Canva", "Illustration", "Photography", "Videography", "Animation",
  "Brand Identity Design", "Typography",

  // Manufacturing
  "Production Planning", "Quality Assurance", "Lean Manufacturing", "Machine Operation",
  "Manufacturing Safety", "Process Improvement", "Inventory Control", "Six Sigma",

  // General / soft skills
  "Leadership", "Team Management", "Communication", "Problem Solving", "Critical Thinking",
  "Time Management", "Project Management", "Strategic Planning", "Adaptability",
  "Public Speaking", "Report Writing", "Stakeholder Management", "Attention to Detail",
  "Multitasking", "Conflict Resolution",
];

// Shown by default before someone types a search query — a compact,
// broadly-relevant starting point rather than dumping the full list.
export const POPULAR_SKILLS = [
  "Communication", "Customer Service", "Sales", "Microsoft Office", "Data Entry",
  "Leadership", "Project Management", "Digital Marketing", "Accounting", "Teaching",
  "Problem Solving", "Time Management", "Social Media Management", "Excel Modeling",
  "Team Management", "Public Speaking", "Content Writing", "Recruitment",
];
