import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pathFor } from '../utils/routes.js';

/** goto('voice', 'voice-pricing') — navigate to a page key, optionally scrolling to an element id. */
export function useGoto() {
  const navigate = useNavigate();
  return useCallback(
    (key, anchor) => navigate(pathFor(key), { state: anchor ? { anchor } : undefined }),
    [navigate]
  );
}

/** <GoLink to="audit" anchor="audit-pricing"> — link to a page key, optionally scrolling to an element id. */
export function GoLink({ to, anchor, children, ...rest }) {
  return (
    <Link to={pathFor(to)} state={anchor ? { anchor } : undefined} {...rest}>
      {children}
    </Link>
  );
}

/** <GoButton to="contact" className="btn secondary"> — a real <button> that navigates. */
export function GoButton({ to, anchor, children, ...rest }) {
  const goto = useGoto();
  return (
    <button type="button" onClick={() => goto(to, anchor)} {...rest}>
      {children}
    </button>
  );
}
