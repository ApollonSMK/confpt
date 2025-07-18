'use server';

import { createServerClient } from "@/lib/supabase/server";
import { type Submission } from "@/lib/data";

// This file is now primarily for the submission form action.
// The getSubmissions logic has been moved to /profile/actions.ts to be reused.
