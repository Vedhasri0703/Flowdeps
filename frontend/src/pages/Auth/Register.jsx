// Register redirects to the combined auth page (Login.jsx handles both tabs)
import { Navigate } from 'react-router-dom';
const Register = () => <Navigate to="/login?tab=signup" replace />;
export default Register;
