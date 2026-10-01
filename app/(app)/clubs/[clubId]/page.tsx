import { getClub, getClubMembers, getMyClubMembership, getAnnouncements } from "@/lib/actions/clubs";
import { notFound } from "next/navigation";
import ClubDetailClient from "./ClubDetailClient";

export default async function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const club = await getClub(clubId);
  if (!club) notFound();

  const [members, myMembership, announcements] = await Promise.all([
    getClubMembers(clubId),
    getMyClubMembership(clubId),
    getAnnouncements(clubId),
  ]);

  return (
    <ClubDetailClient
      club={club}
      initialMembers={members}
      initialMyMembership={myMembership}
      initialAnnouncements={announcements}
    />
  );
}
