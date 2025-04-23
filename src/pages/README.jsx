export default function Readme() {
  return (
    <div className="container mx-auto p-6 prose prose-slate max-w-4xl">
      <h1>Synapse Project Management System</h1>

      <h2>Database Schema</h2>

      <h3>Project</h3>
      <ul>
        <li><code>id</code> (auto-generated)</li>
        <li><code>title</code> (string) - Project name</li>
        <li><code>description</code> (string) - Project description</li>
        <li><code>status</code> (enum) - ["planning", "in_progress", "on_hold", "completed"]</li>
        <li><code>start_date</code> (date)</li>
        <li><code>target_date</code> (date)</li>
        <li><code>created_date</code> (auto-generated)</li>
        <li><code>created_by</code> (user email, auto-generated)</li>
      </ul>

      <h3>Task</h3>
      <ul>
        <li><code>id</code> (auto-generated)</li>
        <li><code>title</code> (string) - Task title</li>
        <li><code>description</code> (string) - Task description</li>
        <li><code>project_id</code> (string, optional) - Reference to project</li>
        <li><code>status</code> (string) - Current status (dynamic based on board columns)</li>
        <li><code>priority</code> (enum) - ["low", "medium", "high", "urgent"]</li>
        <li><code>assigned_to</code> (string) - Team member email</li>
        <li><code>due_date</code> (date)</li>
        <li><code>role</code> (enum) - ["frontend", "backend", "devops", "qa", "design", "product", "other"]</li>
        <li><code>created_date</code> (auto-generated)</li>
        <li><code>created_by</code> (user email, auto-generated)</li>
      </ul>

      <h3>TeamMember</h3>
      <ul>
        <li><code>id</code> (auto-generated)</li>
        <li><code>email</code> (string) - Team member email</li>
        <li><code>role</code> (enum) - Various technical roles</li>
        <li><code>seniority</code> (enum) - ["junior", "mid", "senior", "lead", "principal"]</li>
        <li><code>availability</code> (enum) - ["full_time", "part_time", "contractor"]</li>
        <li><code>expertise</code> (array of strings)</li>
        <li><code>projects</code> (array of project IDs)</li>
        <li><code>created_date</code> (auto-generated)</li>
        <li><code>created_by</code> (user email, auto-generated)</li>
      </ul>

      <h3>StatusColumn (Board Columns)</h3>
      <ul>
        <li><code>id</code> (auto-generated)</li>
        <li><code>key</code> (string) - Unique identifier for the status</li>
        <li><code>title</code> (string) - Display name</li>
        <li><code>color</code> (string) - Column theme color</li>
        <li><code>order</code> (number) - Display order</li>
        <li><code>is_active</code> (boolean)</li>
        <li><code>created_date</code> (auto-generated)</li>
        <li><code>created_by</code> (user email, auto-generated)</li>
      </ul>

      <h2>Authentication</h2>
      <p>Authentication is handled by the base44 platform. Users can log in using their Google accounts or other supported authentication methods configured in the platform.</p>

      <h2>API Access</h2>
      <p>All entities are accessible through the base44 SDK, which provides standard CRUD operations:</p>
      <ul>
        <li><code>Entity.create(data)</code></li>
        <li><code>Entity.list()</code></li>
        <li><code>Entity.update(id, data)</code></li>
        <li><code>Entity.delete(id)</code></li>
        <li><code>Entity.filter(conditions)</code></li>
      </ul>
    </div>
  );
}