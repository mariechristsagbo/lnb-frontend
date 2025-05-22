"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import '@fortawesome/fontawesome-free/css/all.min.css';
import styles from './clock.module.css';
import "./styles.css";

// Composant Clock
const Clock: React.FC = () => {
  const [hour, setHour] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [textHour, setTextHour] = useState("00");
  const [textMinutes, setTextMinutes] = useState("00");
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();  // Changé de let à const
      setHour(date.getHours() * 30 + date.getMinutes() / 12);
      setMinutes(date.getMinutes() * 6);
      setSeconds(date.getSeconds() * 6);

      const hh = date.getHours();  // Changé de let à const
      const hhStr = (hh === 0 ? 12 : hh) < 10 ? `0${hh}` : `${hh}`;
      setTextHour(`${hhStr}:`);

      const mm = date.getMinutes();  // Changé de let à const
      const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
      setTextMinutes(mmStr);

      setDateDay(date.getDate().toString());
      const monthNames = [  // Ajout de const
        "janv",
        "févr",
        "mars",
        "avr",
        "mai",
        "juin",
        "juil",
        "août",
        "sept",
        "oct",
        "nov",
        "déc",
      ];
      setDateMonth(monthNames[date.getMonth()]);
      setDateYear(date.getFullYear().toString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("selected-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList[savedTheme === "dark" ? "add" : "remove"]("dark-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("selected-theme", newTheme);
  };

  return (
    <section className={`clock container ${theme}`}>
      <div className="clock__container grid">
        <div className="clock__content grid">
          <div className="clock__circle">
            <span className="clock__twelve"></span>
            <span className="clock__three"></span>
            <span className="clock__six"></span>
            <span className="clock__nine"></span>

            <div className="clock__rounder"></div>
            <div className="clock__hour" style={{ transform: `rotateZ(${hour}deg)` }}></div>
            <div className="clock__minutes" style={{ transform: `rotateZ(${minutes}deg)` }}></div>
            <div className="clock__seconds" style={{ transform: `rotateZ(${seconds}deg)` }}></div>

            <div className="clock__theme" onClick={toggleTheme}>
              <i className={`bx ${theme === "light" ? "bxs-moon" : "bxs-sun"}`}></i>
            </div>
          </div>

          <div>
            <div className="clock__text">
              <div className="clock__text-hour">{textHour}</div>
              <div className="clock__text-minutes">{textMinutes}</div>
            </div>

            <div className="clock__date">
              <span>{dateDay}</span>
              <span>{dateMonth}</span>
              <span>{dateYear}</span>
            </div>
          </div>
        </div>

        <a
          href="https://portfolio-jonathan-araldi.netlify.app/"
          target="_blank"
          rel="noreferrer"
          className="clock__logo"
        >
          Abomey Calavie - Arconville
        </a>
      </div>
    </section>
  );
};

// Composant principal affiché dans la page
export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Horloge" />
      <div className="space-y-6">
        {/* Affichage d'une partie de style depuis clock.module.css */}
        <div className={styles.clock}>Horloge</div>
        {/* Insertion du composant Clock */}
        <Clock />
      </div>
    </div>
  );
}
