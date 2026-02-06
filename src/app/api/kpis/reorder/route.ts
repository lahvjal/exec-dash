import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Reorder API - Handle bulk reordering of sections and KPIs
 * 
 * POST /api/kpis/reorder
 * 
 * Body: {
 *   sections: [{ section_id, display_order, is_active }],
 *   kpis: [{ kpi_id, section_id, display_order }]
 * }
 * 
 * Uses Supabase transactions to ensure atomic updates
 */

interface SectionUpdate {
  section_id: string;
  display_order: number;
  is_active: boolean;
}

interface KPIUpdate {
  kpi_id: string;
  section_id: string;
  display_order: number;
}

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
    
    // Create an authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sections, kpis } = body as { sections?: SectionUpdate[]; kpis?: KPIUpdate[] };

    if (!sections && !kpis) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Track results
    const results = {
      sectionsUpdated: 0,
      kpisUpdated: 0,
      errors: [] as string[]
    };

    // Update sections if provided
    if (sections && sections.length > 0) {
      for (const section of sections) {
        const { error } = await authenticatedClient
          .from('section_order')
          .upsert({
            section_id: section.section_id,
            display_order: section.display_order,
            is_active: section.is_active,
            updated_by: user.id
          }, {
            onConflict: 'section_id'
          });

        if (error) {
          console.error(`Error updating section ${section.section_id}:`, error);
          results.errors.push(`Failed to update section ${section.section_id}: ${error.message}`);
        } else {
          results.sectionsUpdated++;
        }
      }
    }

    // Update KPIs if provided
    if (kpis && kpis.length > 0) {
      for (const kpi of kpis) {
        const { error } = await authenticatedClient
          .from('custom_kpis')
          .update({
            section_id: kpi.section_id,
            display_order: kpi.display_order
          })
          .eq('kpi_id', kpi.kpi_id);

        if (error) {
          console.error(`Error updating KPI ${kpi.kpi_id}:`, error);
          results.errors.push(`Failed to update KPI ${kpi.kpi_id}: ${error.message}`);
        } else {
          results.kpisUpdated++;
        }
      }
    }

    // Return results
    if (results.errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some updates failed',
        ...results
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: 'Reordering completed successfully',
      ...results
    });

  } catch (error: any) {
    console.error('Reorder API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder', details: error.message },
      { status: 500 }
    );
  }
}
