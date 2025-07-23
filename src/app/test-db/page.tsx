import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function TestDatabasePage() {
  // Test Supabase connection
  const supabase = await createClient();
  
  // Test fetching categories via Supabase
  const { data: supabaseCategories, error: supabaseError } = await supabase
    .from("category")
    .select("id, name, created_at")
    .limit(5);

  // Test fetching categories via Prisma
  let prismaCategories = [];
  let prismaError = null;
  
  try {
    prismaCategories = await prisma.category.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        created_at: true,
      }
    });
  } catch (error) {
    prismaError = error;
  }

  // Also fetch some stats
  let itemCount = 0;
  let bookCount = 0;
  let userCount = 0;
  
  try {
    itemCount = await prisma.items.count();
    bookCount = await prisma.book.count();
    userCount = await prisma.users.count();
  } catch (error) {
    console.error('Error counting records:', error);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Database Stats:</h2>
        <p>Total Items: {itemCount}</p>
        <p>Total Books: {bookCount}</p>
        <p>Total Users: {userCount}</p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Categories via Supabase Client:</h2>
        {supabaseError ? (
          <div className="text-red-500">
            <p>Error: {supabaseError.message}</p>
            <pre className="bg-red-50 p-4 rounded mt-2">{JSON.stringify(supabaseError, null, 2)}</pre>
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(supabaseCategories, null, 2)}</pre>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Categories via Prisma:</h2>
        {prismaError ? (
          <div className="text-red-500">
            <p>Error: {prismaError.message || prismaError.toString()}</p>
            <pre className="bg-red-50 p-4 rounded mt-2">{JSON.stringify(prismaError, null, 2)}</pre>
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(prismaCategories, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}