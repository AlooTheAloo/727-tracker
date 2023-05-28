import React from "react";

function LoginSwipeScreenFirstPage() {
  return (
    <div>
      <div className="flex h-96 w-full items-center justify-center flex-col">
        <div className="h-48 flex flex-col w-full items-center justify-center">
          <div className="h-2/5 w-4/5 xl:w-3/5 bg-[#f3f8fc] m-1 flex p-5 items-center rounded-xl justify-center">
            <div className="h-14 w-14 bg-blue-700 rounded-xl flex items-center">
              <p className="text-center w-full text-white text-xl">
                <b>72</b>
              </p>
            </div>

            <div className="h-full flex flex-col justify-center ml-5 w-28">
              <p className="text-lg">
                <b>Tâches</b>
              </p>
              <p className="text-xs">Affectés à vous</p>
            </div>
          </div>
          <div className="h-2/5 w-4/5 xl:w-3/5 bg-[#f3f8fc] m-1 flex p-5 items-center rounded-xl justify-center">
            <div className="h-14 w-14 bg-blue-400 rounded-xl flex items-center">
              <p className="text-center w-full text-white text-xl">
                <b>7</b>
              </p>
            </div>

            <div className="h-full flex flex-col justify-center ml-5 w-28">
              <p className="text-lg">
                <b>Événements</b>
              </p>
              <p className="text-xs">Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xl text-center mt-12">
            Gérez vos projets &nbsp;
            <b>facilement</b>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginSwipeScreenFirstPage;
