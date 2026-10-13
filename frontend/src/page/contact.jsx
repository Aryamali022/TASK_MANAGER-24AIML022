// A simple static page. It is lazy-loaded like the other secondary routes.
function ContactPage() {
  return (
    <div className="container">
      <h1>Contact</h1>
      <p>Questions or feedback about Task Manager? Get in touch.</p>

      <ul className="contact-list">
        <li>
          <strong>Email</strong>
          <span>support@taskmanager.local</span>
        </li>
        <li>
          <strong>Course</strong>
          <span>AWDF &middot; 5th semester</span>
        </li>
        <li>
          <strong>Office hours</strong>
          <span>Mon&ndash;Fri, 10:00&ndash;17:00</span>
        </li>
      </ul>
    </div>
  );
}

export default ContactPage;
