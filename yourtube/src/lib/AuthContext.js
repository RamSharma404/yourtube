import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState, createContext, useEffect, useContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";

const UserContext = createContext();

const SOUTHERN_STATES = new Set([
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
]);

const getLocationDetails = async () => {
  // TEMPORARY OVERRIDE FOR INTERNSHIP TESTING: Force South India Location
  return {
    city: "Chennai",
    state: "Tamil Nadu",
  };
};

const getThemeFromSession = (user) => {
  if (!user?.lastLoginAt) {
    return "dark";
  }

  const isSouthUser = SOUTHERN_STATES.has(user.state);

  // TEMPORARY OVERRIDE FOR INTERNSHIP TESTING: 
  // Force Light Theme for South Indian users regardless of what time it is!
  if (isSouthUser) {
    return "light";
  }

  return "dark";
};

const needsMobileOtp = (state = "") => !SOUTHERN_STATES.has(state);

const getStoredPhone = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("user_phone") || "";
};

const requestMobileNumber = (state = "") => {
  const storedPhone = getStoredPhone();
  if (storedPhone) return storedPhone;
  if (!needsMobileOtp(state)) return "";

  const phone = window.prompt("Enter your registered mobile number for OTP verification");
  const cleanedPhone = (phone || "").replace(/\D/g, "");

  if (cleanedPhone.length < 10) {
    throw new Error("A valid mobile number is required for OTP verification.");
  }

  localStorage.setItem("user_phone", cleanedPhone);
  return cleanedPhone;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [appTheme, setAppTheme] = useState("dark");

  const persistUser = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    setAppTheme(getThemeFromSession(userdata));
  };

  const stagePendingUser = (userdata) => {
    setUser(userdata);
    setAppTheme(getThemeFromSession(userdata));
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
    setPendingVerification(null);
    setAppTheme("dark");
  };

  const logout = async () => {
    clearUser();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const location = await getLocationDetails();
      const phone = requestMobileNumber(location.state);
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
        city: location.city,
        state: location.state,
        phone,
      };
      const response = await axiosInstance.post("/user/login", payload);

      if (response.data.requiresOtp) {
        setPendingVerification({
          userId: response.data.result._id,
          channel: response.data.otpChannel,
          previewOtp: response.data.previewOtp,
          email: response.data.result.email,
          phone: response.data.result.phone,
        });
        stagePendingUser(response.data.result);
        return;
      }

      persistUser(response.data.result);
    } catch (error) {
      if (error.code === "auth/popup-blocked") {
        alert("Your browser is blocking the Google Sign-In popup. Please allow popups for this website in your browser settings (look for an icon in your URL address bar).");
      } else {
        alert("Login Error: " + (error.response?.data?.message || error.message || JSON.stringify(error)));
      }
      console.error(error);
    }
  };

  const verifyOtp = async (otp) => {
    if (!pendingVerification?.userId) {
      throw new Error("No OTP verification in progress");
    }

    const response = await axiosInstance.post("/user/verify-otp", {
      userId: pendingVerification.userId,
      otp,
    });

    persistUser(response.data.result);
    setPendingVerification(null);
    return response.data.result;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.isVerified === false) {
          localStorage.removeItem("user");
          return;
        }
        setUser(parsed);
        setAppTheme(getThemeFromSession(parsed));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, []);

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (!firebaseuser) {
        return;
      }

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.isVerified === false) {
            localStorage.removeItem("user");
            return;
          }
          setUser(parsed);
          setAppTheme(getThemeFromSession(parsed));
        }
      } catch (error) {
        console.error(error);
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        logout,
        handlegooglesignin,
        verifyOtp,
        pendingVerification,
        appTheme,
        setUser: persistUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
