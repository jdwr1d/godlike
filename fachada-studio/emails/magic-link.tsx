import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

type Props = { url: string; brand: string };

// Bilingual (es first). Lime #d1fe17 button per the brand tokens.
export function MagicLinkEmail({ url, brand }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Entrar a ${brand} · Sign in to ${brand}`}</Preview>
      <Body style={{ backgroundColor: "#0b0b0b", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
        <Container style={{ maxWidth: 480, padding: "32px 24px" }}>
          <Text style={{ fontSize: 22, fontWeight: 700, textTransform: "uppercase" }}>{brand}</Text>
          <Text>Haga clic para entrar a su cuenta. El enlace vence en 24 horas y solo funciona una vez.</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{ backgroundColor: "#d1fe17", color: "#000", padding: "12px 20px", borderRadius: 8, fontWeight: 700 }}
            >
              {`Entrar a ${brand}`}
            </Button>
          </Section>
          <Text style={{ color: "#aaa", fontSize: 13 }}>Si el botón no funciona, copie este enlace: {url}</Text>
          <Text style={{ color: "#aaa", fontSize: 13 }}>
            Click to sign in. The link expires in 24 hours and works once. If you did not request it, ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function magicLinkText(url: string, brand: string) {
  return `Entrar a ${brand}: ${url}\n\nSign in to ${brand}: ${url}\n`;
}
