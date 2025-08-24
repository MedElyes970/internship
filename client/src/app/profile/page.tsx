"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateProfile,
  sendEmailVerification,
  deleteUser,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const ProfilePage = () => {
  const { user, logout, resetPassword } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [buttonTimer, setButtonTimer] = useState(0);
  const [password, setPassword] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const [initialData, setInitialData] = useState({
    displayName: user?.displayName || "",
    shippingInfo: {
      name: "",
      email: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [deleteError, setDeleteError] = useState("");

  const refreshUser = async () => {
    if (!user) return;
    await user.reload(); // fetch latest data from Firebase
    setCurrentUser({ ...user }); // force React to re-render
  };

  useEffect(() => {
    if (!user) return;

    const fetchShippingInfo = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const fetchedShippingInfo =
          data.shippingInfo || initialData.shippingInfo;
        setShippingInfo(fetchedShippingInfo);

        setInitialData({
          displayName: user.displayName || "",
          shippingInfo: fetchedShippingInfo,
        });
      }
    };

    fetchShippingInfo();
  }, [user]);

  // Clear verification message when user verifies email
  useEffect(() => {
    if (
      currentUser?.emailVerified &&
      verificationMessage === "Verification email sent! Check your inbox."
    ) {
      setVerificationMessage("");
    }
  }, [currentUser?.emailVerified, verificationMessage]);

  const hasChanges = () => {
    if (displayName !== initialData.displayName) return true;

    for (const key in shippingInfo) {
      if (
        shippingInfo[key as keyof typeof shippingInfo] !==
        initialData.shippingInfo[key as keyof typeof shippingInfo]
      ) {
        return true;
      }
    }

    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name in shippingInfo) {
      setShippingInfo((prev) => ({ ...prev, [name]: value }));
    } else if (name === "displayName") {
      setDisplayName(value);
    }
  };

  // Update profile + shipping info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Prevent empty display name
    if (!displayName.trim()) {
      setMessage("Display name cannot be empty.");
      setDisplayName(initialData.displayName);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await updateProfile(user, { displayName });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { displayName, shippingInfo });
      setMessage("Profile updated successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setInitialData({ displayName, shippingInfo });
    } catch (error: any) {
      setMessage("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;

    setSendingVerification(true);
    setVerificationMessage("");

    try {
      await sendEmailVerification(user);
      setVerificationMessage("Verification email sent! Check your inbox.");
      setButtonTimer(60);
    } catch (error: any) {
      setVerificationMessage(
        "Error sending verification email: " + error.message
      );
    } finally {
      setSendingVerification(false);
    }
  };

  useEffect(() => {
    if (buttonTimer <= 0) return;
    const interval = setInterval(() => {
      setButtonTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [buttonTimer]);

  useEffect(() => {
    refreshUser(); // refresh user on page load

    const handleFocus = () => {
      refreshUser(); // refresh user whenever window gains focus
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!password) {
      setDeleteError("Please enter your password to confirm deletion.");
      return;
    }

    try {
      setLoading(true);
      setDeleteError("");

      // Reauthenticate
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Optional: mark deletion in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { deletionRequestedAt: new Date() });

      // Delete user
      await deleteUser(user);

      router.push("/signup");
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    setUpdatingPassword(true);
    setPasswordMessage("");

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordMessage("Password updated successfully!");
      setMessage("Password updated successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordModal(false);
    } catch (error: any) {
      setPasswordMessage("Error updating password: " + error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-8 items-center justify-center mt-12 px-4">
        <h1 className="text-2xl font-medium">Your Profile</h1>

        <div className="w-full max-w-3xl shadow-lg border border-gray-100 p-8 rounded-lg flex flex-col gap-8 bg-white">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover mx-auto sm:mx-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}

            <div className="flex-1 flex flex-col gap-1 mt-2 sm:mt-0">
              <h2 className="text-lg font-semibold">
                {user?.displayName || "User"}
              </h2>

              <div className="flex flex-col sm:flex-row justify-between items-center w-full text-sm text-gray-800 gap-1 sm:gap-2 mt-1">
                <div className="flex items-center gap-2 break-all">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user?.email}</span>
                </div>

                {currentUser?.emailVerified ? (
                  <span className="text-green-600 text-xs font-medium mt-1 sm:mt-0">
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      await handleSendVerification();
                      refreshUser(); // optional: immediately refresh after sending
                    }}
                    disabled={sendingVerification || buttonTimer > 0}
                    className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-400 mt-1 sm:mt-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {buttonTimer > 0
                      ? `Wait ${buttonTimer}s`
                      : sendingVerification
                      ? "Sending..."
                      : "Verify"}
                  </button>
                )}
              </div>

              {verificationMessage && (
                <p
                  className={`text-xs mt-1 ${
                    verificationMessage.includes("Error")
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {verificationMessage}
                </p>
              )}
            </div>
          </div>

          {/* Profile + Shipping Form */}
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  message.includes("Error") ||
                  message === "Display name cannot be empty."
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-green-50 text-green-600 border border-green-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="displayName"
                  className="text-sm font-medium text-gray-700"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-sm"
                />
              </div>

              {showPasswordModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-200/70 backdrop-blur-sm z-50 px-4">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 shadow-xl">
                    <div className="flex items-center gap-2 text-blue-600">
                      <User className="w-5 h-5 shrink-0" />
                      <h2 className="text-lg font-semibold">Change Password</h2>
                    </div>

                    <p className="text-sm text-gray-700">
                      Enter your current password and the new password below.
                    </p>

                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    {passwordMessage && (
                      <p
                        className={`text-xs mt-1 ${
                          passwordMessage.includes("Error")
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {passwordMessage}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={
                          !currentPassword || !newPassword || updatingPassword
                        }
                        className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                          !currentPassword || !newPassword || updatingPassword
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {updatingPassword ? "Updating..." : "Update Password"}
                      </button>

                      <button
                        onClick={() => {
                          setShowPasswordModal(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setPasswordMessage("");
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      Forgot your current password?{" "}
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={async () => {
                          if (!user?.email) return;
                          try {
                            await resetPassword(user.email);
                            setPasswordMessage(
                              "Reset email sent! Check your inbox."
                            );
                          } catch (err: any) {
                            setPasswordMessage(
                              "Error sending reset email: " + err.message
                            );
                          }
                        }}
                      >
                        Reset it
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-800">
                Shipping Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "name",
                  "email",
                  "phone",
                  "address",
                  "apartment",
                  "city",
                  "state",
                  "zip",
                  "country",
                ].map((key) => (
                  <input
                    key={key}
                    type={key === "email" ? "email" : "text"}
                    name={key}
                    placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={shippingInfo[key as keyof typeof shippingInfo]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-1 mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Account Created
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {user?.metadata.creationTime
                      ? new Date(
                          user.metadata.creationTime
                        ).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
              {/* Update Profile */}
              <button
                type="submit"
                disabled={loading || !hasChanges()}
                className={`w-full sm:flex-1 px-6 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                  loading || !hasChanges()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-900"
                }`}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>

              {/* Change Password */}
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full sm:flex-1 px-6 py-2 rounded-lg text-white flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900"
              >
                Change Password
              </button>

              {/* Log Out Icon Only on large screens, full button on small screens */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center"
              >
                <LogOut className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="sm:hidden ml-2">Sign out</span>
              </button>
            </div>

            {/* Danger Zone Toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowDeleteButton((prev) => !prev)}
                className="text-red-600 text-sm font-medium hover:underline transition-all"
              >
                Danger Zone
              </button>

              {/* Smooth reveal of Delete Account button */}
              <div
                className={`mt-2 overflow-hidden transition-[max-height,opacity] duration-300 ${
                  showDeleteButton
                    ? "max-h-20 opacity-100"
                    : "max-h-0 opacity-0"
                } flex justify-center`}
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 rounded-lg text-white flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </form>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-200/70 backdrop-blur-sm z-50 px-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h2 className="text-lg font-semibold">
                  Confirm Account Deletion
                </h2>
              </div>

              <p className="text-sm text-gray-700">
                This action is <strong>irreversible</strong>. To confirm, enter
                your password below.
              </p>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />

              {/* ERROR MESSAGE */}
              {deleteError && (
                <p className="text-xs mt-1 text-red-600">{deleteError}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={!password || loading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    password && !loading
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-red-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>

                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPassword("");
                    setDeleteError(""); // clear error when canceling
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-2 text-sm text-gray-600 text-center">
                Forgot your password?{" "}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={async () => {
                    if (!user?.email) return;
                    try {
                      await resetPassword(user.email);
                      alert("Reset email sent! Check your inbox.");
                    } catch (err: any) {
                      alert("Error sending reset email: " + err.message);
                    }
                  }}
                >
                  Reset it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
