import { Avatar } from "@/components/og/avatar";
import { Badge } from "@/components/og/badge";

export interface ProfileProps {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  website: string;
}

export const Profile = ({ name, role, bio, avatar, website }: ProfileProps) => (
  <div
    style={{
      alignItems: "center",
      backgroundColor: "#F7F3EA",
      backgroundImage:
        "radial-gradient(circle at 0% 100%, rgba(213,28,57,0.14), transparent 55%)",
      color: "#1A1A1A",
      display: "flex",
      gap: "64px",
      height: "100%",
      padding: "80px",
      width: "100%",
    }}
  >
    <Avatar
      background="#D51C39"
      name={name}
      size={300}
      src={avatar}
      style={{ border: "4px solid #D51C39", fontSize: "120px" }}
    />

    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontSize: "72px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {name}
      </div>
      <div
        style={{
          color: "#D51C39",
          display: "flex",
          fontSize: "34px",
          fontWeight: 600,
          marginTop: "12px",
        }}
      >
        {role}
      </div>
      <div
        style={{
          color: "#57534E",
          display: "flex",
          fontSize: "28px",
          lineHeight: 1.4,
          marginTop: "24px",
          maxWidth: "560px",
        }}
      >
        {bio}
      </div>
      <Badge
        background="#ffffff"
        borderColor="rgba(26,26,26,0.15)"
        color="#1A1A1A"
        style={{
          alignSelf: "flex-start",
          fontWeight: 500,
          marginTop: "32px",
          padding: "10px 24px",
        }}
      >
        {website}
      </Badge>
    </div>
  </div>
);
