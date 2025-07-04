import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAuth } from "../../../context/AuthContext";
import { Toaster, toast } from "react-hot-toast";

type PasswordField = "password";

const Login = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from AuthContext

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData.email, formData.password);
      const user = JSON.parse(localStorage.getItem("user") ?? JSON.stringify({ role: "student" }));
      switch (user.role) {
        case "admin":
          navigate(routes.adminDashboard);
          break;
        case "teacher":
          navigate(routes.teacherDashboard);
          break;
        case "parent":
          navigate(routes.parentDashboard);
          break;
        case "student":
          navigate(routes.studentDashboard);
          break;
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    localStorage.setItem("menuOpened", "Dashboard");
  }, []);

  return (
    <>
      <div className="container-fuild">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="login-wrapper w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row">
            <div className="col-lg-6" style={{ backgroundColor: "#fff" }}>
              <div className="d-lg-flex align-items-center justify-content-center d-lg-block d-none flex-wrap vh-100 overflowy-auto" style={{ backgroundColor: "#fff" }}>
                <div>
                  <ImageWithBasePath src="assets/img/authentication/bg1.png" alt="Img" />
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
                <div className="col-md-8 mx-auto p-4">
                  <form onSubmit={handleSubmit}>
                    <div>
                      <div className="mx-auto mb-5 text-center">
                        <ImageWithBasePath
                          src="assets/img/logo.png"
                          className="img-fluid"
                          alt="Logo"
                        />
                      </div>
                      <div className="card">
                        <div className="card-body p-4">
                          <div className="mb-4">
                            <h2 className="mb-2">Welcome</h2>
                            <p className="mb-0">Please enter your details to sign in</p>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Email Address</label>
                            <div className="input-icon mb-3 position-relative">
                              <span className="input-icon-addon">
                                <i className="ti ti-mail" />
                              </span>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-control"
                                required
                              />
                            </div>
                            <label className="form-label">Password</label>
                            <div className="pass-group">
                              <input
                                type={isPasswordVisible ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="pass-input form-control"
                                required
                              />
                              <span
                                className={`ti toggle-passwords ${isPasswordVisible ? "ti-eye" : "ti-eye-off"}`}
                                onClick={() => togglePasswordVisibility("password")}
                              ></span>
                            </div>
                          </div>
                          <div className="form-wrap form-wrap-checkbox mb-3">
                            <div className="d-flex align-items-center">
                              <div className="form-check form-check-md mb-0">
                                <input className="form-check-input mt-0" type="checkbox" />
                              </div>
                              <p className="ms-1 mb-0">Remember Me</p>
                            </div>
                            <div className="text-end">
                              <Link to={routes.forgotPassword} className="link-danger">
                                Forgot Password?
                              </Link>
                            </div>
                          </div>
                          <div className="mb-3">
                            <button type="submit" className="btn btn-primary w-100">
                              Sign In
                            </button>
                          </div>
                          <div className="text-center">
                            <h6 className="fw-normal text-dark mb-0">
                              Don’t have an account?{" "}
                              <Link to={routes.register} className="hover-a">
                                Create Account
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 text-center">
                        <p className="mb-0">Copyright © 2024 - Neenos EduTech</p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;