import { PenpotClient } from './src/penpot-client.js';

const apiUrl = process.env.PENPOT_API_URL || 'https://design.penpot.app';
const accessToken = process.env.PENPOT_ACCESS_TOKEN;

if (!accessToken) {
  console.error('PENPOT_ACCESS_TOKEN required');
  process.exit(1);
}

const client = new PenpotClient({ apiUrl, accessToken });

const fileId = '4c6f88e6-bf1a-81bd-8007-11a1690e46ae';

async function checkFile() {
  try {
    const file = await client.getFile(fileId);

    console.log('\n\nFile data keys:');
    if (file.data) {
      console.log(Object.keys(file.data as any));
    }

    console.log('\n\nPages array:');
    console.log('file.data.pages:', (file.data as any)?.pages);

    console.log('\n\nPages-index:');
    const pagesIndex = (file.data as any)?.['pages-index'];
    if (pagesIndex) {
      console.log('Type:', typeof pagesIndex);
      console.log('Keys:', Object.keys(pagesIndex));
      console.log('First page:', Object.values(pagesIndex)[0]);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkFile();
