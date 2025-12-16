import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const GOALS_FILE_PATH = path.join(process.cwd(), 'data', 'goals.json');

/**
 * Goals API Routes
 * 
 * GET /api/goals - Retrieve all goals
 * POST /api/goals - Update goals (requires password)
 */

// GET - Retrieve all goals
export async function GET(request: NextRequest) {
  try {
    const fileContent = await fs.readFile(GOALS_FILE_PATH, 'utf-8');
    const goals = JSON.parse(fileContent);
    
    return NextResponse.json({
      success: true,
      goals,
    });
  } catch (error: any) {
    console.error('Error reading goals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read goals', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update goals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goals, password } = body;
    
    // Simple password protection (in production, use proper authentication)
    const ADMIN_PASSWORD = process.env.GOALS_PASSWORD || 'aveyo2025';
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    if (!goals || typeof goals !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid goals data' },
        { status: 400 }
      );
    }
    
    // Validate goals structure
    const validKpis = [
      'total_sales',
      'installs_complete',
      'avg_days_pp_to_install',
      'avg_days_install_to_m2',
      'avg_days_pp_to_pto',
      'total_kw_scheduled',
      'total_kw_installed',
    ];
    
    const validPeriods = ['current_week', 'previous_week', 'mtd', 'ytd', 'next_week'];
    
    // Validate structure
    for (const [kpiId, periods] of Object.entries(goals)) {
      if (!validKpis.includes(kpiId)) {
        return NextResponse.json(
          { success: false, error: `Invalid KPI ID: ${kpiId}` },
          { status: 400 }
        );
      }
      
      if (typeof periods !== 'object') {
        return NextResponse.json(
          { success: false, error: `Invalid periods for KPI: ${kpiId}` },
          { status: 400 }
        );
      }
      
      for (const [period, value] of Object.entries(periods as Record<string, any>)) {
        if (!validPeriods.includes(period)) {
          return NextResponse.json(
            { success: false, error: `Invalid period: ${period}` },
            { status: 400 }
          );
        }
        
        if (typeof value !== 'number' || value < 0) {
          return NextResponse.json(
            { success: false, error: `Invalid value for ${kpiId}.${period}: must be a positive number` },
            { status: 400 }
          );
        }
      }
    }
    
    // Write to file
    await fs.writeFile(GOALS_FILE_PATH, JSON.stringify(goals, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'Goals updated successfully',
      goals,
    });
    
  } catch (error: any) {
    console.error('Error updating goals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update goals', details: error.message },
      { status: 500 }
    );
  }
}
