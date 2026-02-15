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
            <Text style={heading}>Welcome to OpenFermi!</Text>

            <Text style={paragraph}>Hey there,</Text>

            <Text style={paragraph}>
              Hello trailblazer! Welcome to <strong>OpenFermi</strong> and <strong>Tars</strong>!
              We are a small team of engineers, designers and educators who want to make you succeed in STEM and as a 1st step to your future.
              We distill knowledge out from past papers and a world class LLMs (large language models) 
              to create a platform that is as close to a real teacher as possible. Includes a bonus kicker : Richard Feynman as a tutor whenever you need help / or hints.
              We would love to hear from you.
              Always up for feedback / suggestions / critic on how we together can make this platform better.
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
                Sign in to OpenFermi
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions, just reply to this email — I read every
              one.
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
