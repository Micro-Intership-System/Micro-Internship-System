import { useParams } from "react-router-dom";
import StudentPortfolioPage from "../student/StudentPortfolioPage";

export default function EmployerStudentPortfolioPage() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <StudentPortfolioPage
      readonly
      studentId={studentId}
    />
  );
}
