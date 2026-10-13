import { NavLink } from 'react-router-dom';

// Links between the routes. NavLink adds the "active" class to the link of
// the page you are on.
function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" end>Tasks</NavLink>
      <NavLink to="/projects">Projects</NavLink>
      <NavLink to="/stats">Stats</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </nav>
  );
}

export default NavBar;
