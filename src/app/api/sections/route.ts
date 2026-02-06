import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Section Order API
 * 
 * GET - Fetch section order
 * POST - Update section order
 */

// GET - Fetch section order
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: sections, error } = await supabase
      .from('section_order')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching section order:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sections: sections || []
    });

  } catch (error: any) {
    console.error('Section Order API GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section order', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update section order
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sections } = body;

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: sections array required' },
        { status: 400 }
      );
    }

    // Update each section's display order
    const updates = sections.map((section, index) => ({
      section_id: section.section_id,
      display_order: index + 1,
      is_active: section.is_active !== undefined ? section.is_active : true,
      updated_by: user.id
    }));

    // Use upsert to insert or update
    const { error: upsertError } = await authenticatedClient
      .from('section_order')
      .upsert(updates, { 
        onConflict: 'section_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error updating section order:', upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Section order updated successfully'
    });

  } catch (error: any) {
    console.error('Section Order API POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section order', details: error.message },
      { status: 500 }
    );
  }
}
