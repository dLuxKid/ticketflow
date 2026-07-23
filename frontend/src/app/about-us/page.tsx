import Image from "next/image";

import CommunicateWithUs from "@/assets/images/Chat.png";
import createEvent from "@/assets/images/Events.png";
import Location from "@/assets/images/Location.png";

import Container from "@/components/container";
import SignupSection from "@/components/signup-section";

const team_item = [
  { name: "Marvellous Adetunji", photo: "https://ui-avatars.com/api/?name=Marvellous+Adetunji&background=6528F7&color=fff&size=256", role: "Frontend Developer" },
  { name: "Olasubomi Abiola", photo: "https://ui-avatars.com/api/?name=Olasubomi+Abiola&background=6528F7&color=fff&size=256", role: "UI/UX Designer" },
  { name: "Opeyemi Akoki", photo: "https://ui-avatars.com/api/?name=Opeyemi+Akoki&background=6528F7&color=fff&size=256", role: "DevOps Engineer" },
  { name: "Ofejiro Ederhi", photo: "https://ui-avatars.com/api/?name=Ofejiro+Ederhi&background=6528F7&color=fff&size=256", role: "Backend Developer" },
  { name: "Desmond Ijeoma", photo: "https://ui-avatars.com/api/?name=Desmond+Ijeoma&background=6528F7&color=fff&size=256", role: "Project Manager" },
];

export default function AboutUs() {
  return (
    <main>
      <div className="p-[5%]">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 w-full">
          <div className="w-full flex-1 flex items-center md:items-start justify-center flex-col gap-2 md:gap-4">
            <h1 className="title-text text-center md:text-start text-main-black">
              Who we are
            </h1>
            <p className="body-text text-center md:text-start text-main-black">
              TicketFlow is an event ticketing and discovery platform designed
              to transform the event space and enhance event attendee experience.
              Our mission is to connect event attendees with a wide range of
              events while providing event organisers with event management
              tools and resources to create events that transcend the norm. Not
              only are we building a community of event enthusiasts, TicketFlow
              in its entirety guarantees event experiences that are more
              accessible, personalized and memorable.
            </p>
          </div>
          <div className="w-full flex-center flex-1 min-h-[10rem]">
            <Image src={createEvent} alt="create event" />
          </div>
        </div>
      </div>
      <section>
        <Container>
          <h3 className="title-text mb-6 md:mb-16 text-center w-full text-main-purple">
            Our Core Features
          </h3>
          <div className="flex-center flex-col w-full gap-12">
            <div className="flex-between flex-col md:flex-row gap-4 w-full">
              <div className="w-full flex-1 flex items-center md:items-start justify-center flex-col gap-2 md:gap-4">
                <h3 className="title-text text-center md:text-start text-main-black">
                  Discovering events
                </h3>
                <p className="body-text text-center md:text-start text-main-black">
                  Through event discovery, we are at the forefront of events
                  keeping you up to speed with the latest events and providing
                  you with more personalized options to choose from.
                </p>
              </div>
              <div className="w-full flex-center flex-1 min-h-[10rem]">
                <Image src={createEvent} alt="create event" />
              </div>
            </div>

            <div className="flex-between flex-col-reverse md:flex-row gap-4 w-full">
              <div className="w-full flex-center flex-1 min-h-[10rem]">
                <Image src={CommunicateWithUs} alt="communicate with us" />
              </div>
              <div className="w-full flex-1 flex items-center md:items-start justify-center flex-col gap-2 md:gap-4 md:pl-8">
                <h3 className="title-text text-center md:text-start text-main-black">
                  Creating Events
                </h3>
                <p className="body-text text-center md:text-start text-main-black">
                  Our platform empowers event organisers with event management
                  tools, marketing solutions and data analytics to create and
                  promote events aimed at enhancing user experience.
                </p>
              </div>
            </div>

            <div className="flex-between flex-col md:flex-row gap-4 w-full">
              <div className="w-full flex-1 flex items-center md:items-start justify-center flex-col gap-2 md:gap-4">
                <h3 className="title-text text-center md:text-start text-main-black">
                  Buying Tickets
                </h3>
                <p className="body-text text-center md:text-start text-main-black">
                  We’ve always had both event attendees and event organisers
                  interests at heart. Through our platform, event attendees can
                  purchase tickets from desired events while event organizers
                  can equally create and promote sale of tickets to such events.
                </p>
              </div>
              <div className="w-full flex-center flex-1 min-h-[10rem]">
                <Image src={Location} alt="explore events" />
              </div>
            </div>
          </div>
        </Container>
      </section>
      <section>
        <Container>
          <div className="mb-12">
            <h3 className="title-text mb-6 md:mb-16 text-center w-full text-main-purple">
              Our Team
            </h3>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {team_item.map((member, i) => (
                <div
                  className="flex-center flex-col text-center gap-2 md:gap-4"
                  key={i}
                >
                  <img src={member.photo} alt={member.name} className="rounded-full w-48 h-48 object-cover mb-4" />
                  <h3 className="sub-title-text text-main-black">
                    {member.name}
                  </h3>
                  <p className="body-text text-black">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
          <SignupSection />
        </Container>
      </section>
    </main>
  );
}
