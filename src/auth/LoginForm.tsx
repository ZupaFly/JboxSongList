import { useState } from "react";
import { useAuth } from "./useAuth";

interface LoginFormProps {
  title?: string;
  onSuccess?: () => void;
}

export const LoginForm = ({ title = "Sign in to continue", onSuccess }: LoginFormProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await signIn(email, password);

    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2">
      <h2 className="font-bold">{title}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-1 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-1 rounded"
        required
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};
