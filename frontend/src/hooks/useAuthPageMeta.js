import { createContext, useContext, useEffect } from 'react';

const AuthPageMetaContext = createContext(null);

export const AuthPageMetaProvider = AuthPageMetaContext.Provider;

export const useAuthPageMeta = ({ title, subtitle } = {}) => {
  const setMeta = useContext(AuthPageMetaContext);

  useEffect(() => {
    if (!setMeta) return undefined;

    setMeta((current) => ({
      ...current,
      ...(title !== undefined ? { title } : {}),
      ...(subtitle !== undefined ? { subtitle } : {}),
    }));

    return () => {
      setMeta((current) => {
        const next = { ...current };
        if (title !== undefined) delete next.title;
        if (subtitle !== undefined) delete next.subtitle;
        return next;
      });
    };
  }, [setMeta, title, subtitle]);
};

export default AuthPageMetaContext;
