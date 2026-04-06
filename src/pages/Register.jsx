import { useState } from "react";
import RoleSelectModal from "../components/registration/RoleSelectModal";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "#22212d" }}>
      {open && <RoleSelectModal onClose={handleClose} />}
    </div>
  );
}
