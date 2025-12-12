// src/contexts/PageContext.jsx
// Context per gestire titolo pagina, breadcrumb e azioni nell'header
import React, { createContext, useContext, useState, useCallback } from 'react';

const PageContext = createContext({
  pageTitle: '',
  pageSubtitle: '',
  breadcrumbs: [],
  backButton: null,
  actions: null,
  setPageInfo: () => {},
  clearPageInfo: () => {}
});

export const PageProvider = ({ children }) => {
  const [pageInfo, setPageInfoState] = useState({
    pageTitle: '',
    pageSubtitle: '',
    breadcrumbs: [],
    backButton: null,
    actions: null
  });

  const setPageInfo = useCallback((info) => {
    setPageInfoState(prev => ({
      ...prev,
      ...info
    }));
  }, []);

  const clearPageInfo = useCallback(() => {
    setPageInfoState({
      pageTitle: '',
      pageSubtitle: '',
      breadcrumbs: [],
      backButton: null,
      actions: null
    });
  }, []);

  return (
    <PageContext.Provider value={{ ...pageInfo, setPageInfo, clearPageInfo }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => useContext(PageContext);

// Hook per impostare facilmente le info della pagina
export const usePageInfo = (info, deps = []) => {
  const { setPageInfo, clearPageInfo } = usePageContext();
  
  React.useEffect(() => {
    if (info) {
      setPageInfo(info);
    }
    return () => clearPageInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default PageContext;
