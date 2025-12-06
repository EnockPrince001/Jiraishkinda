import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.forgotPassword({ email });
            setIsSuccess(true);
            toast({
                title: "Email Sent",
                description: "If an account exists with this email, you will receive a password reset link.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send reset email",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription className="mt-2">
                            We've sent a password reset link to <strong>{email}</strong>.
                            Please check your inbox and follow the instructions.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsSuccess(false)}
                        >
                            Didn't receive the email? Try again
                        </Button>
                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
