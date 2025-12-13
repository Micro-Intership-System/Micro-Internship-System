export default function EmployerDashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Employer Dashboard</h1>
      <p>This page will display employer profile & organization details.</p>

      <div style={{ marginTop: "20px" }}>
        <a 
          href="/dashboard/employer/post" 
          style={{ 
            background: "black",
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none"
          }}
        >
          + Post a New Internship
        </a>
      </div>
    </div>
  );
}
