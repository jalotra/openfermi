import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import { Link, Linkedin } from "lucide-react";

interface ApproveEmailProps {
  name?: string;
  loginUrl: string;
}

export function ApproveEmail({ name, loginUrl }: ApproveEmailProps) {
  const greeting = name ? `Hey ${name}` : "Hey there";

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>You&apos;re In!</Text>

            <Text style={paragraph}>{greeting},</Text>

            <Text style={paragraph}>
              Great news — your request to join <strong>OpenFermi</strong> has
              been approved! Please start your learning journey, we would love to hear from you.
              Always up for feedback / suggestions / critic on how we together can make this platform better.
            </Text>
            <Linkedin className="w-4 h-4" />
            <Text style={paragraph}>
              <Link href="https://www.linkedin.com/in/shivamjalotra/">
                Shivam Jalotra
              </Link>
            </Text>

            <Text style={paragraph}>
              Click below to log in and start your first session:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Log in to OpenFermi
              </Button>
            </Section>

            <Text style={paragraph}>
              If you run into anything or have feedback, just reply to this email
              — we&apos;d love to hear from you.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              — Shivam, OpenFermi
            </Text>
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
