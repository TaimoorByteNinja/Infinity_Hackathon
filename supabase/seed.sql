-- Seed: the 10 supplied NovaWorks demo accounts. Password for all: Demo123!  (bcrypt hash below)
-- Idempotent: ON CONFLICT (email) updates instead of duplicating.
INSERT INTO "User" ("id","name","email","passwordHash","role","specialization","skills","updatedAt") VALUES
  ('ADMIN','Admin','admin@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','ADMIN','Administrator',ARRAY['Company overview','Transcript creation'],now()),
  ('PM01','Ayesha Khan','ayesha@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','MANAGER','Web PM',ARRAY['Web projects','Client coordination'],now()),
  ('PM02','Bilal Ahmed','bilal@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','MANAGER','Mobile PM',ARRAY['Mobile projects','Delivery planning'],now()),
  ('PM03','Hina Malik','hina@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','MANAGER','AI PM',ARRAY['AI projects','Requirement review'],now()),
  ('DEV01','Ali Raza','ali@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','Full-Stack',ARRAY['React','Frontend integration'],now()),
  ('DEV02','Hamza Shah','hamza@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','Full-Stack',ARRAY['Node.js','Databases','APIs'],now()),
  ('DEV03','Sara Noor','sara@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','App Developer',ARRAY['Flutter','Mobile UI'],now()),
  ('DEV04','Usman Tariq','usman@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','App Developer',ARRAY['Flutter','Integration','Testing'],now()),
  ('DEV05','Zain Abbas','zain@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','AI Developer',ARRAY['LLMs','Extraction','Prompts'],now()),
  ('DEV06','Maryam Asif','maryam@novaworks.example','$2b$10$7.y4bzRAmsgXt7idh0eIF..OkTHeYhLIbgxbGHMJSGDF4TOiRoM5a','AGENT','AI Developer',ARRAY['Retrieval','Document processing'],now())
ON CONFLICT ("email") DO UPDATE SET
  "name"=EXCLUDED."name","passwordHash"=EXCLUDED."passwordHash","role"=EXCLUDED."role",
  "specialization"=EXCLUDED."specialization","skills"=EXCLUDED."skills","updatedAt"=now();
