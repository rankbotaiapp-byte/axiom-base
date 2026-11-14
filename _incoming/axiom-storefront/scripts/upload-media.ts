import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmltkdpeqgunkrcaphjz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');
const BUCKET_NAME = 'axiom-media';

async function uploadRecursive(dir: string, baseDir: string = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      await uploadRecursive(fullPath, baseDir);
    } else {
      const fileBuffer = fs.readFileSync(fullPath);
      let contentType = 'application/octet-stream';
      if (entry.name.endsWith('.mp4')) contentType = 'video/mp4';
      else if (entry.name.endsWith('.png')) contentType = 'image/png';
      else if (entry.name.endsWith('.jpg') || entry.name.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (entry.name.endsWith('.webm')) contentType = 'video/webm';

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(relativePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`❌ Failed to upload ${relativePath}:`, error.message);
      } else {
        console.log(`✅ Uploaded: ${relativePath}`);
      }
    }
  }
}

async function run() {
  console.log('🚀 Starting batch upload of public/media/ to Supabase Storage...');
  await uploadRecursive(MEDIA_DIR);
  console.log('✨ All media assets uploaded successfully!');
}

run().catch(console.error);