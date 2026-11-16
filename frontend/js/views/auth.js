import { API } from "../api.js";

export function renderAuthModal(container, onAuthSuccess) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 bg-[#0C1729]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <!-- Brand Header -->
        <div class="bg-[#14233D] p-6 text-white text-center">
          <div class="w-12 h-12 rounded-xl bg-[#E99A3A] text-[#0C1729] flex items-center justify-center mx-auto mb-3 font-black text-xl brand-font shadow">
            VS
          </div>
          <h2 class="text-xl font-extrabold tracking-tight brand-font">Vyapar Sarthi Sangi</h2>
          <p class="text-xs text-slate-300 mt-1">Your Business. One System. One Intelligent Sarthi.</p>
        </div>

        <!-- Auth Tabs -->
        <div class="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button id="auth-tab-login" class="flex-1 py-3 text-center border-b-2 border-[#E99A3A] text-[#14233D] bg-white transition">Sign In</button>
          <button id="auth-tab-register" class="flex-1 py-3 text-center border-b-2 border-transparent hover:text-slate-900 transition">Register Enterprise</button>
        </div>

        <div class="p-6">
          <div id="auth-error-msg" class="hidden text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mb-4"></div>

          <!-- Sign In Form -->
          <form id="login-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email</label>
              <input type="email" id="login-email" required placeholder="director@enterprise.com" class="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
              <input type="password" id="login-password" required placeholder="••••••••" class="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <button type="submit" id="btn-login-submit" class="w-full bg-[#14233D] hover:bg-[#0C1729] text-white font-bold py-2.5 rounded-lg text-sm transition shadow">
              Access Business OS
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="hidden space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input type="text" id="reg-name" required placeholder="Arjun Sharma" class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email</label>
              <input type="email" id="reg-email" required placeholder="arjun@enterprise.com" class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Password (Min 8 Characters)</label>
              <input type="password" id="reg-password" required minlength="8" placeholder="••••••••" class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Name</label>
              <input type="text" id="reg-biz" placeholder="Sharma Enterprises" class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Industry Sector</label>
              <input type="text" id="reg-ind" placeholder="Retail / Manufacturing / Healthcare" class="w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <button type="submit" id="btn-reg-submit" class="w-full bg-[#E99A3A] hover:bg-[#D97706] text-[#0C1729] font-bold py-2.5 rounded-lg text-sm transition shadow mt-2">
              Create Enterprise Account
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const tabLogin = document.getElementById("auth-tab-login");
  const tabReg = document.getElementById("auth-tab-register");
  const formLogin = document.getElementById("login-form");
  const formReg = document.getElementById("register-form");
  const errMsg = document.getElementById("auth-error-msg");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("border-[#E99A3A]", "text-[#14233D]", "bg-white");
    tabLogin.classList.remove("border-transparent");
    tabReg.classList.remove("border-[#E99A3A]", "text-[#14233D]", "bg-white");
    tabReg.classList.add("border-transparent");
    formLogin.classList.remove("hidden");
    formReg.classList.add("hidden");
    errMsg.classList.add("hidden");
  });

  tabReg.addEventListener("click", () => {
    tabReg.classList.add("border-[#E99A3A]", "text-[#14233D]", "bg-white");
    tabReg.classList.remove("border-transparent");
    tabLogin.classList.remove("border-[#E99A3A]", "text-[#14233D]", "bg-white");
    tabLogin.classList.add("border-transparent");
    formReg.classList.remove("hidden");
    formLogin.classList.add("hidden");
    errMsg.classList.add("hidden");
  });

  // Login handler
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    errMsg.classList.add("hidden");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const res = await API.login({ email, password });
      API.setToken(res.token);
      if (res.businesses && res.businesses.length > 0) {
        API.setActiveBusinessId(res.businesses[0].id);
      }
      container.innerHTML = "";
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      errMsg.innerText = err.message || "Invalid credentials.";
      errMsg.classList.remove("hidden");
    }
  });

  // Register handler
  formReg.addEventListener("submit", async (e) => {
    e.preventDefault();
    errMsg.classList.add("hidden");
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const business_name = document.getElementById("reg-biz").value.trim();
    const industry = document.getElementById("reg-ind").value.trim();

    try {
      const res = await API.register({ name, email, password, business_name, industry });
      API.setToken(res.token);
      if (res.business) {
        API.setActiveBusinessId(res.business.id);
      }
      container.innerHTML = "";
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      errMsg.innerText = err.message || "Failed to register.";
      errMsg.classList.remove("hidden");
    }
  });
}
