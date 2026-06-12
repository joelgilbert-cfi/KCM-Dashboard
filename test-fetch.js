const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dlnixdanghxtfguxkqqp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbml4ZGFuZ2h4dGZndXhrcXFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY0NzE5NSwiZXhwIjoyMDk2MjIzMTk1fQ.BqujgH3mo-s-6g1zvWVw3IYfBufFfvgsdIoK54epD0Y'
);

async function testFetch() {
  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .is('removed_at', null);
  
  console.log('With removed_at=null filter:', data?.length, error);
  if (data?.length > 0) {
    console.log('Sample data keys:', Object.keys(data[0]));
    console.log('Sample removed_at value:', data[0].removed_at, typeof data[0].removed_at);
  }

  const { data: allData, error: allError } = await supabase
    .from('clusters')
    .select('*');
    
  console.log('Without filter:', allData?.length, allError);
}

testFetch();
