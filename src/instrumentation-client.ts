import { watchBrowserErrors } from '@/lib/errorReports';

// Runs before the page renders, so an error of its first render is reported too.
if (process.env.NODE_ENV === 'production') watchBrowserErrors();
