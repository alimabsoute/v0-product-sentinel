-- ═══════════════════════════════════════════════════════════════════
-- functions.sql — primary function vocabulary seed (Day 3.5 Layer 1)
-- Date: 2026-04-10
-- Sources:
--   docs/STRATEGIC-PLAN.md  § Taxonomy System (Layer 1 — hierarchical functions)
--   docs/wireframes         /categories, /sub-categories, /functions/[slug]
--
-- Round A decisions (locked 2026-04-10):
--   - Naming: kebab-case slug == name, display_name is Title Case
--   - Leaves are noun-phrases describing tool type (not use cases)
--   - Singular (code-editor, not code-editors)
--   - Vendor-neutral (no notion-clones / slack-alternatives)
--   - -other catch-all per subcategory (safety valve for non-specializers)
--   - Granularity: Futurepedia-style (~3-10 products per leaf)
--   - 15 top-level categories including Gaming, Data merged into Analytics
--
-- Structure:
--   15 categories (depth 0)
--  115 subcategories (depth 1)
--  414 leaves (depth 2)
--  ────
--  544 total rows
--
-- Hierarchical insert strategy:
--   Depth 0 — direct insert (parent_id NULL)
--   Depth 1 — VALUES + JOIN on functions where depth=0
--   Depth 2 — VALUES + JOIN on functions where depth=1
-- ═══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- Depth 0 — 15 top-level categories
-- ────────────────────────────────────────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id) VALUES
  ('ai-tools',       'ai-tools',       'AI Tools',       0, NULL),
  ('dev-tools',      'dev-tools',      'Dev Tools',      0, NULL),
  ('productivity',   'productivity',   'Productivity',   0, NULL),
  ('design',         'design',         'Design',         0, NULL),
  ('marketing',      'marketing',      'Marketing',      0, NULL),
  ('analytics',      'analytics',      'Analytics',      0, NULL),
  ('finance',        'finance',        'Finance',        0, NULL),
  ('communication',  'communication',  'Communication',  0, NULL),
  ('security',       'security',       'Security',       0, NULL),
  ('hardware',       'hardware',       'Hardware',       0, NULL),
  ('entertainment',  'entertainment',  'Entertainment',  0, NULL),
  ('education',      'education',      'Education',      0, NULL),
  ('health',         'health',         'Health',         0, NULL),
  ('ecommerce',      'ecommerce',      'E-commerce',     0, NULL),
  ('gaming',         'gaming',         'Gaming',         0, NULL)
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Depth 1 — 115 subcategories
-- ────────────────────────────────────────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT v.slug, v.slug, v.display_name, 1, p.id
FROM (VALUES
  -- AI (15)
  ('ai-writing-assistants',    'AI Writing Assistants',    'ai-tools'),
  ('ai-image-generation',      'AI Image Generation',      'ai-tools'),
  ('ai-video-generation',      'AI Video Generation',      'ai-tools'),
  ('ai-audio-generation',      'AI Audio Generation',      'ai-tools'),
  ('ai-coding-assistants',     'AI Coding Assistants',     'ai-tools'),
  ('ai-chatbots',              'AI Chatbots',              'ai-tools'),
  ('ai-agents',                'AI Agents',                'ai-tools'),
  ('ai-productivity',          'AI Productivity',          'ai-tools'),
  ('ai-search',                'AI Search',                'ai-tools'),
  ('ai-translation',           'AI Translation',           'ai-tools'),
  ('llm-platforms',            'LLM Platforms',            'ai-tools'),
  ('ai-model-marketplaces',    'AI Model Marketplaces',    'ai-tools'),
  ('ai-data-labeling',         'AI Data Labeling',         'ai-tools'),
  ('ai-avatars',               'AI Avatars',               'ai-tools'),
  ('ai-design-tools',          'AI Design Tools',          'ai-tools'),

  -- Dev (14)
  ('code-editors',             'Code Editors',             'dev-tools'),
  ('version-control',          'Version Control',          'dev-tools'),
  ('ci-cd',                    'CI / CD',                  'dev-tools'),
  ('testing-tools',            'Testing Tools',            'dev-tools'),
  ('api-tools',                'API Tools',                'dev-tools'),
  ('databases',                'Databases',                'dev-tools'),
  ('backend-frameworks',       'Backend Frameworks',       'dev-tools'),
  ('frontend-frameworks',      'Frontend Frameworks',      'dev-tools'),
  ('devops-tools',             'DevOps Tools',             'dev-tools'),
  ('developer-productivity',   'Developer Productivity',   'dev-tools'),
  ('package-managers',         'Package Managers',         'dev-tools'),
  ('error-tracking',           'Error Tracking',           'dev-tools'),
  ('dev-analytics',            'Dev Analytics',            'dev-tools'),
  ('low-code-platforms',       'Low-Code Platforms',       'dev-tools'),

  -- Productivity (10)
  ('note-taking-apps',         'Note-Taking Apps',         'productivity'),
  ('task-managers',            'Task Managers',            'productivity'),
  ('calendar-apps',            'Calendar Apps',            'productivity'),
  ('time-tracking',            'Time Tracking',            'productivity'),
  ('project-management',       'Project Management',       'productivity'),
  ('document-editors',         'Document Editors',         'productivity'),
  ('spreadsheets',             'Spreadsheets',             'productivity'),
  ('presentations',            'Presentations',            'productivity'),
  ('file-management',          'File Management',          'productivity'),
  ('password-managers',        'Password Managers',        'productivity'),

  -- Design (8)
  ('ui-design-tools',          'UI Design Tools',          'design'),
  ('graphic-design',           'Graphic Design',           'design'),
  ('photo-editing',            'Photo Editing',            'design'),
  ('video-editing',            'Video Editing',            'design'),
  ('3d-design',                '3D Design',                'design'),
  ('font-tools',               'Font Tools',               'design'),
  ('color-tools',              'Color Tools',              'design'),
  ('icon-libraries',           'Icon Libraries',           'design'),

  -- Marketing (8)
  ('email-marketing',          'Email Marketing',          'marketing'),
  ('seo-tools',                'SEO Tools',                'marketing'),
  ('social-media-management',  'Social Media Management',  'marketing'),
  ('content-marketing',        'Content Marketing',        'marketing'),
  ('landing-page-builders',    'Landing Page Builders',    'marketing'),
  ('crm',                      'CRM',                      'marketing'),
  ('ad-platforms',             'Ad Platforms',             'marketing'),
  ('growth-tools',             'Growth Tools',             'marketing'),

  -- Analytics (6)
  ('product-analytics',        'Product Analytics',        'analytics'),
  ('web-analytics',            'Web Analytics',            'analytics'),
  ('marketing-analytics',      'Marketing Analytics',      'analytics'),
  ('business-intelligence',    'Business Intelligence',    'analytics'),
  ('data-warehouses',          'Data Warehouses',          'analytics'),
  ('etl-tools',                'ETL Tools',                'analytics'),

  -- Finance (6)
  ('personal-finance',         'Personal Finance',         'finance'),
  ('investing',                'Investing',                'finance'),
  ('accounting',               'Accounting',               'finance'),
  ('invoicing',                'Invoicing',                'finance'),
  ('payments',                 'Payments',                 'finance'),
  ('tax-tools',                'Tax Tools',                'finance'),

  -- Communication (6)
  ('team-chat',                'Team Chat',                'communication'),
  ('video-conferencing',       'Video Conferencing',       'communication'),
  ('email-clients',            'Email Clients',            'communication'),
  ('forum-platforms',          'Forum Platforms',          'communication'),
  ('newsletter-platforms',     'Newsletter Platforms',     'communication'),
  ('voip-sms',                 'VoIP / SMS',               'communication'),

  -- Security (7)
  ('vpn-services',             'VPN Services',             'security'),
  ('antivirus',                'Antivirus',                'security'),
  ('vulnerability-scanners',   'Vulnerability Scanners',   'security'),
  ('secrets-management',       'Secrets Management',       'security'),
  ('identity-access',          'Identity & Access',        'security'),
  ('penetration-testing',      'Penetration Testing',      'security'),
  ('endpoint-security',        'Endpoint Security',        'security'),

  -- Hardware (6)
  ('smartphones',              'Smartphones',              'hardware'),
  ('laptops',                  'Laptops',                  'hardware'),
  ('wearables',                'Wearables',                'hardware'),
  ('audio-hardware',           'Audio Hardware',           'hardware'),
  ('input-devices',            'Input Devices',            'hardware'),
  ('smart-home',               'Smart Home',               'hardware'),

  -- Entertainment (6)
  ('streaming-services',       'Streaming Services',       'entertainment'),
  ('podcast-platforms',        'Podcast Platforms',        'entertainment'),
  ('social-networks',          'Social Networks',          'entertainment'),
  ('dating-apps',              'Dating Apps',              'entertainment'),
  ('news-aggregators',         'News Aggregators',         'entertainment'),
  ('reading-apps',             'Reading Apps',             'entertainment'),

  -- Education (6)
  ('online-courses',           'Online Courses',           'education'),
  ('language-learning',        'Language Learning',        'education'),
  ('tutoring',                 'Tutoring',                 'education'),
  ('study-tools',              'Study Tools',              'education'),
  ('research-tools',           'Research Tools',           'education'),
  ('kids-education',           'Kids Education',           'education'),

  -- Health (6)
  ('fitness-apps',             'Fitness Apps',             'health'),
  ('nutrition',                'Nutrition',                'health'),
  ('meditation',               'Meditation & Sleep',       'health'),
  ('mental-health',            'Mental Health',            'health'),
  ('telehealth',               'Telehealth',               'health'),
  ('health-tracking',          'Health Tracking',          'health'),

  -- Ecommerce (6)
  ('ecommerce-platforms',      'E-commerce Platforms',     'ecommerce'),
  ('marketplaces',             'Marketplaces',             'ecommerce'),
  ('dropshipping',             'Dropshipping',             'ecommerce'),
  ('pos-systems',              'POS Systems',              'ecommerce'),
  ('inventory-management',     'Inventory Management',     'ecommerce'),
  ('subscription-boxes',       'Subscription Boxes',       'ecommerce'),

  -- Gaming (5)
  ('game-engines',             'Game Engines',             'gaming'),
  ('game-launchers',           'Game Launchers',           'gaming'),
  ('game-development-tools',   'Game Development Tools',   'gaming'),
  ('esports-platforms',        'Esports Platforms',        'gaming'),
  ('modding-tools',            'Modding Tools',            'gaming')
) AS v(slug, display_name, parent_slug)
JOIN functions p ON p.slug = v.parent_slug AND p.depth = 0
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Depth 2 — 414 leaves
-- Each row: (slug, display_name, parent_subcategory_slug)
-- name column is populated from slug via a lateral select
-- ────────────────────────────────────────────────────────────────
INSERT INTO functions (slug, name, display_name, depth, parent_id)
SELECT v.slug, v.slug, v.display_name, 2, p.id
FROM (VALUES

  -- ═══ AI TOOLS ═══════════════════════════════════════════════════

  -- AI Writing Assistants (10)
  ('ai-long-form-writer',      'AI Long-Form Writer',      'ai-writing-assistants'),
  ('ai-email-writer',          'AI Email Writer',          'ai-writing-assistants'),
  ('ai-copywriter',            'AI Copywriter',            'ai-writing-assistants'),
  ('ai-blog-generator',        'AI Blog Generator',        'ai-writing-assistants'),
  ('ai-paraphraser',           'AI Paraphraser',           'ai-writing-assistants'),
  ('ai-grammar-checker',       'AI Grammar Checker',       'ai-writing-assistants'),
  ('ai-summarizer',            'AI Summarizer',            'ai-writing-assistants'),
  ('ai-meeting-note-taker',    'AI Meeting Note Taker',    'ai-writing-assistants'),
  ('ai-voice-to-text-editor',  'AI Voice-to-Text Editor',  'ai-writing-assistants'),
  ('ai-writing-assistant-other', 'AI Writing Assistant (Other)', 'ai-writing-assistants'),

  -- AI Image Generation (8)
  ('text-to-image-generator',  'Text-to-Image Generator',  'ai-image-generation'),
  ('image-to-image-editor',    'Image-to-Image Editor',    'ai-image-generation'),
  ('ai-image-upscaler',        'AI Image Upscaler',        'ai-image-generation'),
  ('ai-background-remover',    'AI Background Remover',    'ai-image-generation'),
  ('ai-inpainting-tool',       'AI Inpainting Tool',       'ai-image-generation'),
  ('ai-avatar-generator',      'AI Avatar Generator',      'ai-image-generation'),
  ('ai-logo-generator',        'AI Logo Generator',        'ai-image-generation'),
  ('ai-image-generator-other', 'AI Image Generator (Other)', 'ai-image-generation'),

  -- AI Video Generation (6)
  ('text-to-video-generator',  'Text-to-Video Generator',  'ai-video-generation'),
  ('ai-video-editor',          'AI Video Editor',          'ai-video-generation'),
  ('ai-video-upscaler',        'AI Video Upscaler',        'ai-video-generation'),
  ('ai-lip-sync-tool',         'AI Lip-Sync Tool',         'ai-video-generation'),
  ('ai-motion-capture',        'AI Motion Capture',        'ai-video-generation'),
  ('ai-video-generator-other', 'AI Video Generator (Other)', 'ai-video-generation'),

  -- AI Audio Generation (5)
  ('ai-music-generator',       'AI Music Generator',       'ai-audio-generation'),
  ('text-to-speech',           'Text-to-Speech',           'ai-audio-generation'),
  ('ai-voice-cloner',          'AI Voice Cloner',          'ai-audio-generation'),
  ('ai-sound-effects',         'AI Sound Effects',         'ai-audio-generation'),
  ('ai-audio-generator-other', 'AI Audio Generator (Other)', 'ai-audio-generation'),

  -- AI Coding Assistants (6)
  ('ai-pair-programmer',       'AI Pair Programmer',       'ai-coding-assistants'),
  ('ai-code-review',           'AI Code Review',           'ai-coding-assistants'),
  ('ai-test-generator',        'AI Test Generator',        'ai-coding-assistants'),
  ('ai-bug-fixer',             'AI Bug Fixer',             'ai-coding-assistants'),
  ('ai-code-migrator',         'AI Code Migrator',         'ai-coding-assistants'),
  ('ai-coding-assistant-other', 'AI Coding Assistant (Other)', 'ai-coding-assistants'),

  -- AI Chatbots (4)
  ('ai-chat-assistant',        'AI Chat Assistant',        'ai-chatbots'),
  ('ai-customer-support-bot',  'AI Customer Support Bot',  'ai-chatbots'),
  ('ai-roleplay-chatbot',      'AI Roleplay Chatbot',      'ai-chatbots'),
  ('ai-chatbot-other',         'AI Chatbot (Other)',       'ai-chatbots'),

  -- AI Agents (5)
  ('autonomous-agent',         'Autonomous Agent',         'ai-agents'),
  ('ai-task-automation',       'AI Task Automation',       'ai-agents'),
  ('ai-browser-agent',         'AI Browser Agent',         'ai-agents'),
  ('ai-research-agent',        'AI Research Agent',        'ai-agents'),
  ('ai-agent-other',           'AI Agent (Other)',         'ai-agents'),

  -- AI Productivity (5)
  ('ai-scheduler',             'AI Scheduler',             'ai-productivity'),
  ('ai-email-assistant',       'AI Email Assistant',       'ai-productivity'),
  ('ai-task-manager',          'AI Task Manager',          'ai-productivity'),
  ('ai-knowledge-assistant',   'AI Knowledge Assistant',   'ai-productivity'),
  ('ai-productivity-other',    'AI Productivity (Other)',  'ai-productivity'),

  -- AI Search (4)
  ('ai-search-engine',         'AI Search Engine',         'ai-search'),
  ('ai-research-tool',         'AI Research Tool',         'ai-search'),
  ('ai-answer-engine',         'AI Answer Engine',         'ai-search'),
  ('ai-search-other',          'AI Search (Other)',        'ai-search'),

  -- AI Translation (3)
  ('ai-translator',            'AI Translator',            'ai-translation'),
  ('ai-dubbing-tool',          'AI Dubbing Tool',          'ai-translation'),
  ('ai-translation-other',     'AI Translation (Other)',   'ai-translation'),

  -- LLM Platforms (5)
  ('llm-hosting',              'LLM Hosting',              'llm-platforms'),
  ('llm-fine-tuning',          'LLM Fine-Tuning',          'llm-platforms'),
  ('llm-orchestration',        'LLM Orchestration',        'llm-platforms'),
  ('llm-evaluation',           'LLM Evaluation',           'llm-platforms'),
  ('llm-platform-other',       'LLM Platform (Other)',     'llm-platforms'),

  -- AI Model Marketplaces (3)
  ('model-hub',                'Model Hub',                'ai-model-marketplaces'),
  ('fine-tuned-model-marketplace', 'Fine-Tuned Model Marketplace', 'ai-model-marketplaces'),
  ('ai-model-marketplace-other', 'AI Model Marketplace (Other)', 'ai-model-marketplaces'),

  -- AI Data Labeling (3)
  ('data-labeling-platform',   'Data Labeling Platform',   'ai-data-labeling'),
  ('synthetic-data-generator', 'Synthetic Data Generator', 'ai-data-labeling'),
  ('ai-data-labeling-other',   'AI Data Labeling (Other)', 'ai-data-labeling'),

  -- AI Avatars (3)
  ('ai-talking-avatar',        'AI Talking Avatar',        'ai-avatars'),
  ('ai-lip-sync-avatar',       'AI Lip-Sync Avatar',       'ai-avatars'),
  ('ai-avatar-other',          'AI Avatar (Other)',        'ai-avatars'),

  -- AI Design Tools (3)
  ('ai-ui-generator',          'AI UI Generator',          'ai-design-tools'),
  ('ai-design-assistant',      'AI Design Assistant',      'ai-design-tools'),
  ('ai-design-tool-other',     'AI Design Tool (Other)',   'ai-design-tools'),

  -- ═══ DEV TOOLS ═══════════════════════════════════════════════════

  -- Code Editors (8)
  ('ide',                      'IDE',                      'code-editors'),
  ('lightweight-code-editor',  'Lightweight Code Editor',  'code-editors'),
  ('terminal-code-editor',     'Terminal Code Editor',     'code-editors'),
  ('cloud-ide',                'Cloud IDE',                'code-editors'),
  ('notebook-editor',          'Notebook Editor',          'code-editors'),
  ('markdown-editor',          'Markdown Editor',          'code-editors'),
  ('diff-merge-tool',          'Diff / Merge Tool',        'code-editors'),
  ('code-editor-other',        'Code Editor (Other)',      'code-editors'),

  -- Version Control (3)
  ('git-client',               'Git Client',               'version-control'),
  ('git-hosting',              'Git Hosting',              'version-control'),
  ('version-control-other',    'Version Control (Other)',  'version-control'),

  -- CI / CD (4)
  ('ci-cd-platform',           'CI / CD Platform',         'ci-cd'),
  ('build-system',             'Build System',             'ci-cd'),
  ('deployment-automation',    'Deployment Automation',    'ci-cd'),
  ('ci-cd-other',              'CI / CD (Other)',          'ci-cd'),

  -- Testing Tools (5)
  ('unit-test-framework',      'Unit Test Framework',      'testing-tools'),
  ('e2e-testing',              'E2E Testing',              'testing-tools'),
  ('api-testing',              'API Testing',              'testing-tools'),
  ('load-testing',             'Load Testing',             'testing-tools'),
  ('testing-tool-other',       'Testing Tool (Other)',     'testing-tools'),

  -- API Tools (5)
  ('api-client',               'API Client',               'api-tools'),
  ('api-mock-server',          'API Mock Server',          'api-tools'),
  ('api-gateway',              'API Gateway',              'api-tools'),
  ('api-documentation',        'API Documentation',        'api-tools'),
  ('api-tool-other',           'API Tool (Other)',         'api-tools'),

  -- Databases (6)
  ('sql-database',             'SQL Database',             'databases'),
  ('nosql-database',           'NoSQL Database',           'databases'),
  ('graph-database',           'Graph Database',           'databases'),
  ('vector-database',          'Vector Database',          'databases'),
  ('time-series-database',     'Time-Series Database',     'databases'),
  ('database-other',           'Database (Other)',         'databases'),

  -- Backend Frameworks (2)
  ('backend-web-framework',    'Backend Web Framework',    'backend-frameworks'),
  ('backend-framework-other',  'Backend Framework (Other)', 'backend-frameworks'),

  -- Frontend Frameworks (3)
  ('frontend-framework',       'Frontend Framework',       'frontend-frameworks'),
  ('ui-component-library',     'UI Component Library',     'frontend-frameworks'),
  ('frontend-framework-other', 'Frontend Framework (Other)', 'frontend-frameworks'),

  -- DevOps Tools (6)
  ('infrastructure-as-code',   'Infrastructure as Code',   'devops-tools'),
  ('container-platform',       'Container Platform',       'devops-tools'),
  ('orchestration-tool',       'Orchestration Tool',       'devops-tools'),
  ('monitoring-tool',          'Monitoring Tool',          'devops-tools'),
  ('log-management',           'Log Management',           'devops-tools'),
  ('devops-tool-other',        'DevOps Tool (Other)',      'devops-tools'),

  -- Developer Productivity (5)
  ('code-snippet-manager',     'Code Snippet Manager',     'developer-productivity'),
  ('clipboard-manager',        'Clipboard Manager',        'developer-productivity'),
  ('terminal-multiplexer',     'Terminal Multiplexer',     'developer-productivity'),
  ('dotfile-manager',          'Dotfile Manager',          'developer-productivity'),
  ('developer-productivity-other', 'Developer Productivity (Other)', 'developer-productivity'),

  -- Package Managers (2)
  ('package-manager',          'Package Manager',          'package-managers'),
  ('package-manager-other',    'Package Manager (Other)',  'package-managers'),

  -- Error Tracking (3)
  ('error-tracking-platform',  'Error Tracking Platform',  'error-tracking'),
  ('crash-reporting',          'Crash Reporting',          'error-tracking'),
  ('error-tracking-other',     'Error Tracking (Other)',   'error-tracking'),

  -- Dev Analytics (4)
  ('product-analytics-sdk',    'Product Analytics SDK',    'dev-analytics'),
  ('session-replay',           'Session Replay',           'dev-analytics'),
  ('feature-flag-platform',    'Feature Flag Platform',    'dev-analytics'),
  ('dev-analytics-other',      'Dev Analytics (Other)',    'dev-analytics'),

  -- Low-Code Platforms (4)
  ('no-code-app-builder',      'No-Code App Builder',      'low-code-platforms'),
  ('internal-tool-builder',    'Internal Tool Builder',    'low-code-platforms'),
  ('workflow-automation',      'Workflow Automation',      'low-code-platforms'),
  ('low-code-platform-other',  'Low-Code Platform (Other)', 'low-code-platforms'),

  -- ═══ PRODUCTIVITY ═══════════════════════════════════════════════

  -- Note-Taking Apps (9)
  ('markdown-note-editor',     'Markdown Note Editor',     'note-taking-apps'),
  ('block-based-workspace',    'Block-Based Workspace',    'note-taking-apps'),
  ('outliner',                 'Outliner',                 'note-taking-apps'),
  ('networked-notes',          'Networked Notes',          'note-taking-apps'),
  ('plain-text-notes',         'Plain Text Notes',         'note-taking-apps'),
  ('handwritten-notes',        'Handwritten Notes',        'note-taking-apps'),
  ('voice-notes',              'Voice Notes',              'note-taking-apps'),
  ('quick-capture',            'Quick Capture',            'note-taking-apps'),
  ('note-taking-app-other',    'Note-Taking App (Other)',  'note-taking-apps'),

  -- Task Managers (5)
  ('personal-task-manager',    'Personal Task Manager',    'task-managers'),
  ('team-task-manager',        'Team Task Manager',        'task-managers'),
  ('kanban-board',             'Kanban Board',             'task-managers'),
  ('gtd-app',                  'GTD App',                  'task-managers'),
  ('task-manager-other',       'Task Manager (Other)',     'task-managers'),

  -- Calendar Apps (3)
  ('calendar-app',             'Calendar App',             'calendar-apps'),
  ('meeting-scheduler',        'Meeting Scheduler',        'calendar-apps'),
  ('calendar-app-other',       'Calendar App (Other)',     'calendar-apps'),

  -- Time Tracking (3)
  ('time-tracker',             'Time Tracker',             'time-tracking'),
  ('pomodoro-timer',           'Pomodoro Timer',           'time-tracking'),
  ('time-tracking-other',      'Time Tracking (Other)',    'time-tracking'),

  -- Project Management (4)
  ('project-management-platform', 'Project Management Platform', 'project-management'),
  ('gantt-chart',              'Gantt Chart',              'project-management'),
  ('sprint-planner',           'Sprint Planner',           'project-management'),
  ('project-management-other', 'Project Management (Other)', 'project-management'),

  -- Document Editors (4)
  ('word-processor',           'Word Processor',           'document-editors'),
  ('collaborative-document-editor', 'Collaborative Document Editor', 'document-editors'),
  ('pdf-editor',               'PDF Editor',               'document-editors'),
  ('document-editor-other',    'Document Editor (Other)',  'document-editors'),

  -- Spreadsheets (3)
  ('spreadsheet',              'Spreadsheet',              'spreadsheets'),
  ('database-spreadsheet',     'Database Spreadsheet',     'spreadsheets'),
  ('spreadsheet-other',        'Spreadsheet (Other)',      'spreadsheets'),

  -- Presentations (3)
  ('presentation-maker',       'Presentation Maker',       'presentations'),
  ('slide-designer',           'Slide Designer',           'presentations'),
  ('presentation-other',       'Presentation (Other)',     'presentations'),

  -- File Management (4)
  ('cloud-storage',            'Cloud Storage',            'file-management'),
  ('file-sync',                'File Sync',                'file-management'),
  ('file-explorer',            'File Explorer',            'file-management'),
  ('file-management-other',    'File Management (Other)',  'file-management'),

  -- Password Managers (2)
  ('password-manager',         'Password Manager',         'password-managers'),
  ('password-manager-other',   'Password Manager (Other)', 'password-managers'),

  -- ═══ DESIGN ══════════════════════════════════════════════════════

  -- UI Design Tools (4)
  ('ui-design-platform',       'UI Design Platform',       'ui-design-tools'),
  ('wireframing-tool',         'Wireframing Tool',         'ui-design-tools'),
  ('prototyping-tool',         'Prototyping Tool',         'ui-design-tools'),
  ('ui-design-tool-other',     'UI Design Tool (Other)',   'ui-design-tools'),

  -- Graphic Design (3)
  ('vector-editor',            'Vector Editor',            'graphic-design'),
  ('raster-editor',            'Raster Editor',            'graphic-design'),
  ('graphic-design-other',     'Graphic Design (Other)',   'graphic-design'),

  -- Photo Editing (3)
  ('photo-editor',             'Photo Editor',             'photo-editing'),
  ('raw-processor',            'RAW Processor',            'photo-editing'),
  ('photo-editor-other',       'Photo Editor (Other)',     'photo-editing'),

  -- Video Editing (4)
  ('video-editor',             'Video Editor',             'video-editing'),
  ('color-grading-tool',       'Color Grading Tool',       'video-editing'),
  ('motion-graphics-tool',     'Motion Graphics Tool',     'video-editing'),
  ('video-editor-other',       'Video Editor (Other)',     'video-editing'),

  -- 3D Design (5)
  ('3d-modeling',              '3D Modeling',              '3d-design'),
  ('3d-sculpting',             '3D Sculpting',             '3d-design'),
  ('cad',                      'CAD',                      '3d-design'),
  ('3d-rendering',             '3D Rendering',             '3d-design'),
  ('3d-design-other',          '3D Design (Other)',        '3d-design'),

  -- Font Tools (3)
  ('font-manager',             'Font Manager',             'font-tools'),
  ('font-designer',            'Font Designer',            'font-tools'),
  ('font-tool-other',          'Font Tool (Other)',        'font-tools'),

  -- Color Tools (3)
  ('color-picker',             'Color Picker',             'color-tools'),
  ('palette-generator',        'Palette Generator',        'color-tools'),
  ('color-tool-other',         'Color Tool (Other)',       'color-tools'),

  -- Icon Libraries (3)
  ('icon-library',             'Icon Library',             'icon-libraries'),
  ('illustration-library',     'Illustration Library',     'icon-libraries'),
  ('icon-library-other',       'Icon Library (Other)',     'icon-libraries'),

  -- ═══ MARKETING ══════════════════════════════════════════════════

  -- Email Marketing (3)
  ('email-campaign-tool',      'Email Campaign Tool',      'email-marketing'),
  ('transactional-email',      'Transactional Email',      'email-marketing'),
  ('email-marketing-other',    'Email Marketing (Other)',  'email-marketing'),

  -- SEO Tools (5)
  ('keyword-research-tool',    'Keyword Research Tool',    'seo-tools'),
  ('rank-tracker',             'Rank Tracker',             'seo-tools'),
  ('backlink-checker',         'Backlink Checker',         'seo-tools'),
  ('site-auditor',             'Site Auditor',             'seo-tools'),
  ('seo-tool-other',           'SEO Tool (Other)',         'seo-tools'),

  -- Social Media Management (4)
  ('social-scheduler',         'Social Scheduler',         'social-media-management'),
  ('social-analytics',         'Social Analytics',         'social-media-management'),
  ('social-listening',         'Social Listening',         'social-media-management'),
  ('social-media-management-other', 'Social Media Management (Other)', 'social-media-management'),

  -- Content Marketing (3)
  ('content-planner',          'Content Planner',          'content-marketing'),
  ('editorial-calendar',       'Editorial Calendar',       'content-marketing'),
  ('content-marketing-other',  'Content Marketing (Other)', 'content-marketing'),

  -- Landing Page Builders (3)
  ('landing-page-builder',     'Landing Page Builder',     'landing-page-builders'),
  ('form-builder',             'Form Builder',             'landing-page-builders'),
  ('landing-page-builder-other', 'Landing Page Builder (Other)', 'landing-page-builders'),

  -- CRM (4)
  ('sales-crm',                'Sales CRM',                'crm'),
  ('contact-manager',          'Contact Manager',          'crm'),
  ('pipeline-tracker',         'Pipeline Tracker',         'crm'),
  ('crm-other',                'CRM (Other)',              'crm'),

  -- Ad Platforms (3)
  ('ad-manager',               'Ad Manager',               'ad-platforms'),
  ('ad-creative-tool',         'Ad Creative Tool',         'ad-platforms'),
  ('ad-platform-other',        'Ad Platform (Other)',      'ad-platforms'),

  -- Growth Tools (3)
  ('referral-tool',            'Referral Tool',            'growth-tools'),
  ('viral-loop-tool',          'Viral Loop Tool',          'growth-tools'),
  ('growth-tool-other',        'Growth Tool (Other)',      'growth-tools'),

  -- ═══ ANALYTICS ══════════════════════════════════════════════════

  -- Product Analytics (3)
  ('product-analytics-platform', 'Product Analytics Platform', 'product-analytics'),
  ('funnel-analysis-tool',     'Funnel Analysis Tool',     'product-analytics'),
  ('product-analytics-other',  'Product Analytics (Other)', 'product-analytics'),

  -- Web Analytics (3)
  ('web-analytics-platform',   'Web Analytics Platform',   'web-analytics'),
  ('heatmap-tool',             'Heatmap Tool',             'web-analytics'),
  ('web-analytics-other',      'Web Analytics (Other)',    'web-analytics'),

  -- Marketing Analytics (3)
  ('attribution-platform',     'Attribution Platform',     'marketing-analytics'),
  ('marketing-mix-modeling',   'Marketing Mix Modeling',   'marketing-analytics'),
  ('marketing-analytics-other', 'Marketing Analytics (Other)', 'marketing-analytics'),

  -- Business Intelligence (3)
  ('bi-dashboard',             'BI Dashboard',             'business-intelligence'),
  ('data-visualization-tool',  'Data Visualization Tool',  'business-intelligence'),
  ('business-intelligence-other', 'Business Intelligence (Other)', 'business-intelligence'),

  -- Data Warehouses (3)
  ('data-warehouse',           'Data Warehouse',           'data-warehouses'),
  ('data-lake',                'Data Lake',                'data-warehouses'),
  ('data-warehouse-other',     'Data Warehouse (Other)',   'data-warehouses'),

  -- ETL Tools (4)
  ('etl-platform',             'ETL Platform',             'etl-tools'),
  ('reverse-etl',              'Reverse ETL',              'etl-tools'),
  ('data-pipeline-tool',       'Data Pipeline Tool',       'etl-tools'),
  ('etl-tool-other',           'ETL Tool (Other)',         'etl-tools'),

  -- ═══ FINANCE ════════════════════════════════════════════════════

  -- Personal Finance (4)
  ('budgeting-app',            'Budgeting App',            'personal-finance'),
  ('expense-tracker',          'Expense Tracker',          'personal-finance'),
  ('net-worth-tracker',        'Net Worth Tracker',        'personal-finance'),
  ('personal-finance-other',   'Personal Finance (Other)', 'personal-finance'),

  -- Investing (5)
  ('stock-trading-platform',   'Stock Trading Platform',   'investing'),
  ('crypto-exchange',          'Crypto Exchange',          'investing'),
  ('robo-advisor',             'Robo Advisor',             'investing'),
  ('portfolio-tracker',        'Portfolio Tracker',        'investing'),
  ('investing-other',          'Investing (Other)',        'investing'),

  -- Accounting (3)
  ('accounting-software',      'Accounting Software',      'accounting'),
  ('bookkeeping-tool',         'Bookkeeping Tool',         'accounting'),
  ('accounting-other',         'Accounting (Other)',       'accounting'),

  -- Invoicing (3)
  ('invoice-generator',        'Invoice Generator',        'invoicing'),
  ('billing-platform',         'Billing Platform',         'invoicing'),
  ('invoicing-other',          'Invoicing (Other)',        'invoicing'),

  -- Payments (3)
  ('payment-processor',        'Payment Processor',        'payments'),
  ('subscription-billing',     'Subscription Billing',     'payments'),
  ('payments-other',           'Payments (Other)',         'payments'),

  -- Tax Tools (3)
  ('tax-filing-software',      'Tax Filing Software',      'tax-tools'),
  ('tax-calculator',           'Tax Calculator',           'tax-tools'),
  ('tax-tool-other',           'Tax Tool (Other)',         'tax-tools'),

  -- ═══ COMMUNICATION ══════════════════════════════════════════════

  -- Team Chat (3)
  ('team-messenger',           'Team Messenger',           'team-chat'),
  ('voice-chat-platform',      'Voice Chat Platform',      'team-chat'),
  ('team-chat-other',          'Team Chat (Other)',        'team-chat'),

  -- Video Conferencing (3)
  ('video-meeting-platform',   'Video Meeting Platform',   'video-conferencing'),
  ('webinar-platform',         'Webinar Platform',         'video-conferencing'),
  ('video-conferencing-other', 'Video Conferencing (Other)', 'video-conferencing'),

  -- Email Clients (3)
  ('desktop-email-client',     'Desktop Email Client',     'email-clients'),
  ('web-email-client',         'Web Email Client',         'email-clients'),
  ('email-client-other',       'Email Client (Other)',     'email-clients'),

  -- Forum Platforms (3)
  ('community-platform',       'Community Platform',       'forum-platforms'),
  ('discussion-forum',         'Discussion Forum',         'forum-platforms'),
  ('forum-platform-other',     'Forum Platform (Other)',   'forum-platforms'),

  -- Newsletter Platforms (2)
  ('newsletter-platform',      'Newsletter Platform',      'newsletter-platforms'),
  ('newsletter-platform-other', 'Newsletter Platform (Other)', 'newsletter-platforms'),

  -- VoIP / SMS (3)
  ('voip-service',             'VoIP Service',             'voip-sms'),
  ('sms-gateway',              'SMS Gateway',              'voip-sms'),
  ('voip-sms-other',           'VoIP / SMS (Other)',       'voip-sms'),

  -- ═══ SECURITY ═══════════════════════════════════════════════════

  -- VPN Services (3)
  ('vpn-client',               'VPN Client',               'vpn-services'),
  ('mesh-vpn',                 'Mesh VPN',                 'vpn-services'),
  ('vpn-service-other',        'VPN Service (Other)',      'vpn-services'),

  -- Antivirus (3)
  ('antivirus-scanner',        'Antivirus Scanner',        'antivirus'),
  ('malware-removal-tool',     'Malware Removal Tool',     'antivirus'),
  ('antivirus-other',          'Antivirus (Other)',        'antivirus'),

  -- Vulnerability Scanners (3)
  ('vulnerability-scanner',    'Vulnerability Scanner',    'vulnerability-scanners'),
  ('dependency-scanner',       'Dependency Scanner',       'vulnerability-scanners'),
  ('vulnerability-scanner-other', 'Vulnerability Scanner (Other)', 'vulnerability-scanners'),

  -- Secrets Management (3)
  ('secrets-vault',            'Secrets Vault',            'secrets-management'),
  ('key-management-service',   'Key Management Service',   'secrets-management'),
  ('secrets-management-other', 'Secrets Management (Other)', 'secrets-management'),

  -- Identity & Access (3)
  ('sso-provider',             'SSO Provider',             'identity-access'),
  ('mfa-tool',                 'MFA Tool',                 'identity-access'),
  ('identity-access-other',    'Identity & Access (Other)', 'identity-access'),

  -- Penetration Testing (3)
  ('pentest-platform',         'Pentest Platform',         'penetration-testing'),
  ('red-team-tool',            'Red Team Tool',            'penetration-testing'),
  ('penetration-testing-other', 'Penetration Testing (Other)', 'penetration-testing'),

  -- Endpoint Security (3)
  ('endpoint-protection',      'Endpoint Protection',      'endpoint-security'),
  ('device-management',        'Device Management',        'endpoint-security'),
  ('endpoint-security-other',  'Endpoint Security (Other)', 'endpoint-security'),

  -- ═══ HARDWARE ═══════════════════════════════════════════════════

  -- Smartphones (3)
  ('smartphone',               'Smartphone',               'smartphones'),
  ('feature-phone',            'Feature Phone',            'smartphones'),
  ('smartphone-other',         'Smartphone (Other)',       'smartphones'),

  -- Laptops (4)
  ('consumer-laptop',          'Consumer Laptop',          'laptops'),
  ('workstation-laptop',       'Workstation Laptop',       'laptops'),
  ('gaming-laptop',            'Gaming Laptop',            'laptops'),
  ('laptop-other',             'Laptop (Other)',           'laptops'),

  -- Wearables (4)
  ('smartwatch',               'Smartwatch',               'wearables'),
  ('fitness-tracker',          'Fitness Tracker',          'wearables'),
  ('ar-glasses',               'AR Glasses',               'wearables'),
  ('wearable-other',           'Wearable (Other)',         'wearables'),

  -- Audio Hardware (4)
  ('headphones',               'Headphones',               'audio-hardware'),
  ('earbuds',                  'Earbuds',                  'audio-hardware'),
  ('speaker',                  'Speaker',                  'audio-hardware'),
  ('audio-hardware-other',     'Audio Hardware (Other)',   'audio-hardware'),

  -- Input Devices (4)
  ('keyboard',                 'Keyboard',                 'input-devices'),
  ('mouse',                    'Mouse',                    'input-devices'),
  ('trackpad',                 'Trackpad',                 'input-devices'),
  ('input-device-other',       'Input Device (Other)',     'input-devices'),

  -- Smart Home (4)
  ('smart-speaker',            'Smart Speaker',            'smart-home'),
  ('smart-light',              'Smart Light',              'smart-home'),
  ('smart-thermostat',         'Smart Thermostat',         'smart-home'),
  ('smart-home-other',         'Smart Home (Other)',       'smart-home'),

  -- ═══ ENTERTAINMENT ══════════════════════════════════════════════

  -- Streaming Services (4)
  ('video-streaming-service',  'Video Streaming Service',  'streaming-services'),
  ('music-streaming-service',  'Music Streaming Service',  'streaming-services'),
  ('audiobook-service',        'Audiobook Service',        'streaming-services'),
  ('streaming-service-other',  'Streaming Service (Other)', 'streaming-services'),

  -- Podcast Platforms (3)
  ('podcast-player',           'Podcast Player',           'podcast-platforms'),
  ('podcast-host',             'Podcast Host',             'podcast-platforms'),
  ('podcast-platform-other',   'Podcast Platform (Other)', 'podcast-platforms'),

  -- Social Networks (4)
  ('social-network',           'Social Network',           'social-networks'),
  ('microblog',                'Microblog',                'social-networks'),
  ('photo-social-network',     'Photo Social Network',     'social-networks'),
  ('social-network-other',     'Social Network (Other)',   'social-networks'),

  -- Dating Apps (3)
  ('dating-app',               'Dating App',               'dating-apps'),
  ('matchmaking-platform',     'Matchmaking Platform',     'dating-apps'),
  ('dating-app-other',         'Dating App (Other)',       'dating-apps'),

  -- News Aggregators (3)
  ('news-aggregator',          'News Aggregator',          'news-aggregators'),
  ('rss-reader',               'RSS Reader',               'news-aggregators'),
  ('news-aggregator-other',    'News Aggregator (Other)',  'news-aggregators'),

  -- Reading Apps (3)
  ('ebook-reader',             'Ebook Reader',             'reading-apps'),
  ('article-reader',           'Article Reader',           'reading-apps'),
  ('reading-app-other',        'Reading App (Other)',      'reading-apps'),

  -- ═══ EDUCATION ══════════════════════════════════════════════════

  -- Online Courses (3)
  ('mooc-platform',            'MOOC Platform',            'online-courses'),
  ('course-marketplace',       'Course Marketplace',       'online-courses'),
  ('online-course-other',      'Online Course (Other)',    'online-courses'),

  -- Language Learning (3)
  ('language-learning-app',    'Language Learning App',    'language-learning'),
  ('flashcard-app',            'Flashcard App',            'language-learning'),
  ('language-learning-other',  'Language Learning (Other)', 'language-learning'),

  -- Tutoring (3)
  ('tutoring-platform',        'Tutoring Platform',        'tutoring'),
  ('homework-helper',          'Homework Helper',          'tutoring'),
  ('tutoring-other',           'Tutoring (Other)',         'tutoring'),

  -- Study Tools (3)
  ('study-planner',            'Study Planner',            'study-tools'),
  ('mind-mapping-tool',        'Mind Mapping Tool',        'study-tools'),
  ('study-tool-other',         'Study Tool (Other)',       'study-tools'),

  -- Research Tools (3)
  ('citation-manager',         'Citation Manager',         'research-tools'),
  ('research-database',        'Research Database',        'research-tools'),
  ('research-tool-other',      'Research Tool (Other)',    'research-tools'),

  -- Kids Education (2)
  ('kids-learning-app',        'Kids Learning App',        'kids-education'),
  ('kids-education-other',     'Kids Education (Other)',   'kids-education'),

  -- ═══ HEALTH ═════════════════════════════════════════════════════

  -- Fitness Apps (3)
  ('workout-app',              'Workout App',              'fitness-apps'),
  ('running-tracker',          'Running Tracker',          'fitness-apps'),
  ('fitness-app-other',        'Fitness App (Other)',      'fitness-apps'),

  -- Nutrition (3)
  ('calorie-counter',          'Calorie Counter',          'nutrition'),
  ('meal-planner',             'Meal Planner',             'nutrition'),
  ('nutrition-other',          'Nutrition (Other)',        'nutrition'),

  -- Meditation & Sleep (3)
  ('meditation-app',           'Meditation App',           'meditation'),
  ('sleep-app',                'Sleep App',                'meditation'),
  ('meditation-other',         'Meditation & Sleep (Other)', 'meditation'),

  -- Mental Health (3)
  ('therapy-platform',         'Therapy Platform',         'mental-health'),
  ('mood-tracker',             'Mood Tracker',             'mental-health'),
  ('mental-health-other',      'Mental Health (Other)',    'mental-health'),

  -- Telehealth (3)
  ('telehealth-platform',      'Telehealth Platform',      'telehealth'),
  ('online-pharmacy',          'Online Pharmacy',          'telehealth'),
  ('telehealth-other',         'Telehealth (Other)',       'telehealth'),

  -- Health Tracking (3)
  ('symptom-tracker',          'Symptom Tracker',          'health-tracking'),
  ('cycle-tracker',            'Cycle Tracker',            'health-tracking'),
  ('health-tracking-other',    'Health Tracking (Other)',  'health-tracking'),

  -- ═══ ECOMMERCE ══════════════════════════════════════════════════

  -- E-commerce Platforms (3)
  ('ecommerce-builder',        'E-commerce Builder',       'ecommerce-platforms'),
  ('headless-commerce',        'Headless Commerce',        'ecommerce-platforms'),
  ('ecommerce-platform-other', 'E-commerce Platform (Other)', 'ecommerce-platforms'),

  -- Marketplaces (3)
  ('general-marketplace',      'General Marketplace',      'marketplaces'),
  ('niche-marketplace',        'Niche Marketplace',        'marketplaces'),
  ('marketplace-other',        'Marketplace (Other)',      'marketplaces'),

  -- Dropshipping (2)
  ('dropshipping-platform',    'Dropshipping Platform',    'dropshipping'),
  ('dropshipping-other',       'Dropshipping (Other)',     'dropshipping'),

  -- POS Systems (2)
  ('pos-system',               'POS System',               'pos-systems'),
  ('pos-system-other',         'POS System (Other)',       'pos-systems'),

  -- Inventory Management (3)
  ('inventory-software',       'Inventory Software',       'inventory-management'),
  ('warehouse-management',     'Warehouse Management',     'inventory-management'),
  ('inventory-management-other', 'Inventory Management (Other)', 'inventory-management'),

  -- Subscription Boxes (2)
  ('subscription-box',         'Subscription Box',         'subscription-boxes'),
  ('subscription-box-other',   'Subscription Box (Other)', 'subscription-boxes'),

  -- ═══ GAMING ═════════════════════════════════════════════════════

  -- Game Engines (3)
  ('2d-game-engine',           '2D Game Engine',           'game-engines'),
  ('3d-game-engine',           '3D Game Engine',           'game-engines'),
  ('game-engine-other',        'Game Engine (Other)',      'game-engines'),

  -- Game Launchers (3)
  ('game-launcher',            'Game Launcher',            'game-launchers'),
  ('game-store',               'Game Store',               'game-launchers'),
  ('game-launcher-other',      'Game Launcher (Other)',    'game-launchers'),

  -- Game Development Tools (3)
  ('level-editor',             'Level Editor',             'game-development-tools'),
  ('asset-pipeline',           'Asset Pipeline',           'game-development-tools'),
  ('game-dev-tool-other',      'Game Dev Tool (Other)',    'game-development-tools'),

  -- Esports Platforms (3)
  ('esports-platform',         'Esports Platform',         'esports-platforms'),
  ('matchmaking-tool',         'Matchmaking Tool',         'esports-platforms'),
  ('esports-platform-other',   'Esports Platform (Other)', 'esports-platforms'),

  -- Modding Tools (2)
  ('mod-manager',              'Mod Manager',              'modding-tools'),
  ('modding-tool-other',       'Modding Tool (Other)',     'modding-tools')

) AS v(slug, display_name, parent_slug)
JOIN functions p ON p.slug = v.parent_slug AND p.depth = 1
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Verification counts
-- ────────────────────────────────────────────────────────────────
SELECT depth,
       CASE depth WHEN 0 THEN 'category'
                  WHEN 1 THEN 'subcategory'
                  WHEN 2 THEN 'leaf' END AS kind,
       COUNT(*) AS n
FROM functions
GROUP BY depth
ORDER BY depth;
