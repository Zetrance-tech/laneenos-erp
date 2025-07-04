import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAuth } from "../../../context/AuthContext";
import { Toaster, toast } from "react-hot-toast";

type PasswordField = "password" | "confirmPassword";

const Register2 = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { register } = useAuth(); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match"); 
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.role as 'student' | 'parent' | 'teacher')
      navigate(routes.login); 
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  return (
    <>
      <div className="container-fuild">
        <div className="login-wrapper w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row">
            <div className="col-lg-6">
              <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-lg-block d-none flex-wrap vh-100 overflowy-auto">
                <div>
                  <ImageWithBasePath
                    src="assets/img/authentication/authentication-01.jpg"
                    alt="Img"
                  />
                </div>
                <div className="authen-overlay-item  w-100 p-4">
                  <h4 className="text-white mb-3">
                    What's New on Preskool !!!
                  </h4>
                  <div className="d-flex align-items-center flex-row mb-3 justify-content-between p-3 br-5 gap-3 card">
                    <div>
                      <h6>Summer Vacation Holiday Homework</h6>
                      <p className="mb-0 text-truncate">
                        The school will remain closed from April 20th to June...
                      </p>
                    </div>
                    <Link to="3">
                      <i className="ti ti-chevrons-right" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center flex-row mb-3 justify-content-between p-3 br-5 gap-3 card">
                    <div>
                      <h6>New Academic Session Admission Start(2024-25)</h6>
                      <p className="mb-0 text-truncate">
                        An academic term is a portion of an academic year, the
                        time ....
                      </p>
                    </div>
                    <Link to="3">
                      <i className="ti ti-chevrons-right" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center flex-row mb-3 justify-content-between p-3 br-5 gap-3 card">
                    <div>
                      <h6>Date sheet Final Exam Nursery to Sr.Kg</h6>
                      <p className="mb-0 text-truncate">
                        Dear Parents, As the final examination for the session
                        2024-25 is ...
                      </p>
                    </div>
                    <Link to="3">
                      <i className="ti ti-chevrons-right" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center flex-row mb-3 justify-content-between p-3 br-5 gap-3 card">
                    <div>
                      <h6>Annual Day Function</h6>
                      <p className="mb-0 text-truncate">
                        Annual functions provide a platform for students to
                        showcase their...
                      </p>
                    </div>
                    <Link to="3">
                      <i className="ti ti-chevrons-right" />
                    </Link>
                  </div>
                  <div className="d-flex align-items-center flex-row mb-0 justify-content-between p-3 br-5 gap-3 card">
                    <div>
                      <h6>Summer Vacation Holiday Homework</h6>
                      <p className="mb-0 text-truncate">
                        The school will remain closed from April 20th to June
                        15th for summer...
                      </p>
                    </div>
                    <Link to="3">
                      <i className="ti ti-chevrons-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
                <div className="col-md-8 mx-auto p-4">
                  <form onSubmit={handleSubmit}>
                    <div>
                      <div className=" mx-auto mb-5 text-center">
                        <ImageWithBasePath
                          src="assets/img/authentication/authentication-logo.svg"
                          className="img-fluid"
                          alt="Logo"
                        />
                      </div>
                      <div className="card">
                        <div className="card-body p-4">
                          <div className=" mb-4">
                            <h2 className="mb-2">Register</h2>
                            <p className="mb-0">
                              Please enter your details to sign up
                            </p>
                          </div>
                          <div className="mt-4">
                            <div className="mb-3">
                              <label className="form-label">Name</label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-control"
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Email Address</label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-control"
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Password</label>
                              <input
                                type={
                                  passwordVisibility.password ? "text" : "password"
                                }
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-control"
                                required
                              />
                              <span
                                className={`ti toggle-passwords ${
                                  passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                                }`}
                                onClick={() => togglePasswordVisibility("password")}
                              ></span>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Confirm Password</label>
                              <input
                                type={
                                  passwordVisibility.confirmPassword ? "text" : "password"
                                }
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-control"
                                required
                              />
                              <span
                                className={`ti toggle-passwords ${
                                  passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"
                                }`}
                                onClick={() => togglePasswordVisibility("confirmPassword")}
                              ></span>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Role</label>
                              <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="form-control"
                                required
                              >
                                <option value="student">Student</option>
                                <option value="parent">Parent</option>
                                <option value="teacher">Teacher</option>
                              </select>
                            </div>
                            <div className="form-wrap form-wrap-checkbox mb-3">
                              <div className="d-flex align-items-center">
                                <div className="form-check form-check-md mb-0 me-2">
                                  <input
                                    className="form-check-input mt-0"
                                    type="checkbox"
                                    required
                                  />
                                </div>
                                <h6 className="fw-normal text-dark mb-0">
                                  I Agree to
                                  <Link to="#" className="hover-a ">
                                    {" "}
                                    Terms &amp; Privacy
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <button type="submit" className="btn btn-primary w-100">
                              Sign Up
                            </button>
                          </div>
                          <div className="text-center">
                            <h6 className="fw-normal text-dark mb-0">
                              Already have an account?
                              <Link to={routes.login} className="hover-a ">
                                {" "}
                                Sign In
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 text-center">
                        <p className="mb-0 ">Copyright © 2024 - Preskool</p>
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

export default Register2;