"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError("Masukkan email dan kata sandi untuk melanjutkan.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal terdiri dari 6 karakter.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      : await supabase.auth.signUp({ email: form.email, password: form.password });
    setLoading(false);
    if (result.error) {
      const message = result.error.message.toLowerCase();
      if (message.includes("invalid login credentials")) {
        setError("Email atau kata sandi salah. Jika belum punya akun, pilih Buat akun terlebih dahulu.");
      } else if (message.includes("email not confirmed")) {
        setError("Email belum dikonfirmasi. Periksa inbox email Anda sebelum masuk.");
      } else {
        setError(result.error.message);
      }
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setNotice("Akun berhasil dibuat. Silakan cek email untuk konfirmasi sebelum masuk.");
      return;
    }
    router.push("/dashboard");
  };

  const switchMode = () => {
    setMode((current) => current === "signin" ? "signup" : "signin");
    setError("");
    setNotice("");
  };

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Tentang ZENTA">
        <div className="story-topline"><span className="story-mark"><Sparkles size={15} /></span> ZENTA workspace</div>
        <div className="story-copy">
          <p className="eyebrow">Business, in balance</p>
          <h1>Satu ruang untuk menggerakkan bisnis.</h1>
          <p className="story-description">Pantau uang, pelanggan, stok, dan tim dari satu dashboard yang tenang dan mudah dipahami.</p>
        </div>
        <div className="story-note"><span className="note-dot" /> Data bisnis Anda tersimpan rapi dan siap dipakai.</div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><span className="story-mark"><Sparkles size={14} /></span> ZENTA</div>
          <div className="auth-heading">
            <p className="eyebrow">{mode === "signin" ? "Selamat datang kembali" : "Mulai bersama ZENTA"}</p>
            <h2>{mode === "signin" ? "Masuk ke workspace Anda" : "Buat akun bisnis Anda"}</h2>
            <p>{mode === "signin" ? "Kelola bisnis dengan keputusan yang lebih jernih." : "Siapkan ruang kerja untuk mengelola bisnis dengan lebih tertata."}</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email kerja</label>
            <div className="input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input id="email" name="email" type="email" autoComplete="email" placeholder="nama@perusahaan.com" value={form.email} onChange={updateField} />
            </div>
            <label htmlFor="password">Kata sandi</label>
            <div className="input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan kata sandi" value={form.password} onChange={updateField} />
              <button type="button" className="icon-button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
            {mode === "signin" && <div className="form-options"><label className="check-label"><input type="checkbox" /> <span>Ingat saya</span></label><button type="button" className="text-button">Lupa kata sandi?</button></div>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            <button className="submit-button" type="submit" disabled={loading}>{loading ? "Memproses..." : mode === "signin" ? "Masuk ke ZENTA" : "Buat akun ZENTA"} {!loading && <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-footer">{mode === "signin" ? "Belum memiliki akun?" : "Sudah memiliki akun?"} <button type="button" className="text-button" onClick={switchMode}>{mode === "signin" ? "Buat akun" : "Masuk di sini"}</button></p>
        </div>
        <p className="legal-note">Dengan masuk, Anda menyetujui ketentuan penggunaan ZENTA.</p>
      </section>
    </main>
  );
}
