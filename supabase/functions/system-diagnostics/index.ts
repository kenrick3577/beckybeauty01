// @deno-types="npm:@types/node@20.11.5"
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client with explicit configuration
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const startTime = Date.now();
    let connectionStatus = 'disconnected';
    let usersCount = 0;
    let appointmentsCount = 0;
    const errors: Record<string, string | null> = {};
    const recommendations: Array<{
      type: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];

    // Test database connection and get users count
    try {
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        errors.users = userError.message;
        recommendations.push({
          type: 'error',
          message: 'Unable to fetch users data. Database access might be restricted.',
          severity: 'error'
        });
      } else {
        usersCount = userCount || 0;
        connectionStatus = 'connected';
      }
    } catch (error) {
      errors.users = error.message;
      connectionStatus = 'error';
    }

    // Get appointments count
    try {
      const { count: apptCount, error: apptError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      if (apptError) {
        errors.appointments = apptError.message;
      } else {
        appointmentsCount = apptCount || 0;
      }
    } catch (error) {
      errors.appointments = error.message;
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Add performance recommendations
    if (responseTime > 1000) {
      recommendations.push({
        type: 'performance',
        message: 'Database response time is high. Consider optimizing queries.',
        severity: 'warning'
      });
    }

    if (usersCount === 0) {
      recommendations.push({
        type: 'data',
        message: 'No users found in the database.',
        severity: 'info'
      });
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      connection: {
        status: connectionStatus,
        responseTime,
        error: errors.users || undefined
      },
      data: {
        users: usersCount,
        appointments: appointmentsCount,
        errors
      },
      recommendations
    };

    return new Response(
      JSON.stringify(diagnostics),
      { 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('System diagnostics error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
});