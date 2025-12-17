import { NextRequest, NextResponse } from 'next/server';
import { invalidateGoalsCache } from '@/lib/kpi-service';
import { clearKPICache } from '@/app/api/kpi/route';

/**
 * Cache Invalidation API
 * 
 * DELETE /api/cache - Clear all caches
 */
export async function DELETE(request: NextRequest) {
  try {
    // Clear both caches
    invalidateGoalsCache();
    clearKPICache();
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}
