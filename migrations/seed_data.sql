-- Sample data for insurance fact-find questions

-- Basic personal information questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('What is your full name?', 'text', 1, NULL, NULL),
('What is your email address?', 'email', 2, NULL, NULL),
('What is your date of birth?', 'date', 3, NULL, NULL),
('What is your phone number?', 'tel', 4, NULL, NULL),
('What is your address?', 'textarea', 5, NULL, NULL);

-- Employment and income questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('What is your current employment status?', 'select', 6, 
  '["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Student", "Unemployed", "Other"]', NULL),
('What is your annual income?', 'select', 7,
  '["Less than $30,000", "$30,000-$50,000", "$50,001-$75,000", "$75,001-$100,000", "$100,001-$150,000", "More than $150,000"]', NULL),
('Do you have any additional sources of income?', 'radio', 8,
  '["Yes", "No"]', NULL);

-- Insurance coverage questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Do you currently have any insurance policies?', 'radio', 9,
  '["Yes", "No"]', NULL),
('Which types of insurance do you currently have?', 'checkbox', 10,
  '["Health insurance", "Life insurance", "Home insurance", "Auto insurance", "Disability insurance", "Long-term care insurance", "None"]',
  '{"dependsOn": 9, "showWhen": ["Yes"]}'),
('When was the last time you reviewed your insurance coverage?', 'select', 11,
  '["Within the last 6 months", "6-12 months ago", "1-2 years ago", "More than 2 years ago", "Never"]',
  '{"dependsOn": 9, "showWhen": ["Yes"]}');

-- Risk assessment questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Do you have any pre-existing medical conditions?', 'radio', 12,
  '["Yes", "No"]', NULL),
('Do you smoke or use tobacco products?', 'radio', 13,
  '["Yes", "No"]', NULL),
('Do you have a family history of serious health conditions?', 'radio', 14,
  '["Yes", "No"]', NULL),
('Do you participate in any high-risk activities or hobbies?', 'radio', 15,
  '["Yes", "No"]', NULL),
('If yes, please specify which activities:', 'textarea', 16, NULL,
  '{"dependsOn": 15, "showWhen": ["Yes"]}');

-- Life insurance specific questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Are you interested in life insurance?', 'radio', 17,
  '["Yes", "No"]', NULL),
('What is the primary purpose for your life insurance?', 'select', 18,
  '["Income replacement", "Debt payment", "Burial expenses", "Wealth transfer", "Business purposes", "Other"]',
  '{"dependsOn": 17, "showWhen": ["Yes"]}'),
('How much life insurance coverage do you think you need?', 'select', 19,
  '["Less than $100,000", "$100,000-$250,000", "$250,001-$500,000", "$500,001-$1,000,000", "More than $1,000,000", "Not sure"]',
  '{"dependsOn": 17, "showWhen": ["Yes"]}');

-- Health insurance specific questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Are you interested in health insurance?', 'radio', 20,
  '["Yes", "No"]', NULL),
('What is most important to you in a health insurance plan?', 'select', 21,
  '["Low monthly premium", "Low deductible", "Specific doctors in network", "Prescription drug coverage", "Mental health coverage", "Other"]',
  '{"dependsOn": 20, "showWhen": ["Yes"]}');

-- Property insurance specific questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Do you own or rent your home?', 'select', 22,
  '["Own", "Rent", "Other"]', NULL),
('Are you interested in home/renters insurance?', 'radio', 23,
  '["Yes", "No"]', NULL),
('What is the approximate value of your personal belongings?', 'select', 24,
  '["Less than $20,000", "$20,000-$50,000", "$50,001-$100,000", "More than $100,000"]',
  '{"dependsOn": 23, "showWhen": ["Yes"]}');

-- Auto insurance specific questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('Do you own a vehicle?', 'radio', 25,
  '["Yes", "No"]', NULL),
('Are you interested in auto insurance?', 'radio', 26,
  '["Yes", "No"]',
  '{"dependsOn": 25, "showWhen": ["Yes"]}'),
('How many vehicles do you need to insure?', 'select', 27,
  '["1", "2", "3", "4 or more"]',
  '{"dependsOn": 26, "showWhen": ["Yes"]}');

-- Final questions
INSERT INTO questions (text, type, order, options, conditional_logic) VALUES
('What is your primary goal for reviewing your insurance needs today?', 'textarea', 28, NULL, NULL),
('Is there anything specific you\'d like to know about insurance options?', 'textarea', 29, NULL, NULL),
('How would you prefer to be contacted with insurance recommendations?', 'select', 30,
  '["Email", "Phone", "Text message", "Video call", "In-person meeting"]', NULL);