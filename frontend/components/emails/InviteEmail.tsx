import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import { Linkedin } from "lucide-react";
interface InviteEmailProps {
  email: string;
  loginUrl: string;
}

export function InviteEmail({ email, loginUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>Welcome to Tars!</Text>

            <Text style={paragraph}>Hey there,</Text>

            <Text style={paragraph}>
              Hello trailblazer! Welcome to <strong>Tars</strong> and{" "}
              <strong>Tars</strong>
              We’re a small team of engineers, designers, and educators on a
              mission to help you succeed in STEM — and take your first
              confident steps toward the future you want to build.
            </Text>
            <Text style={paragraph}>
              We distill insights from past papers and combine them with
              world-class large language models to create a learning platform
              that feels as close to a real teacher as possible.
            </Text>
            <Text style={paragraph}>
              And here’s the bonus: whenever you need help, hints, or a fresh
              perspective, you can call on Richard Feynman as your on-demand
              tutor.
            </Text>
            <Text style={paragraph}>
              We’re building this for you — and with you.
              <br />
              Your feedback, suggestions, and honest critiques mean everything
              to us. Let’s make this platform better, together.
            </Text>
            <Linkedin className="w-4 h-4" />
            <Text style={paragraph}>
              <Link href="https://www.linkedin.com/in/shivamjalotra/">
                Shivam Jalotra
              </Link>
            </Text>

            <Text style={paragraph}>
              Your account has been created for <strong>{email}</strong>. Click
              below to sign in and start practicing:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Sign in to Tars
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions, just reply to this email — I read every
              one.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>— Shivam, Tars</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const section = {
  padding: "0 48px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#1a1a1a",
  marginBottom: "24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#404040",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "22px",
};
