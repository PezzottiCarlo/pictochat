import { PersonalPictogram } from "../../routes/PersonalPictograms";
import Utils from "../Utils";

export class PersonalPictogramService {
    static getPersonalPictograms(): PersonalPictogram[] {
        let personalPictograms = localStorage.getItem('personalPictograms');
        return personalPictograms ? JSON.parse(personalPictograms) : [];
    }

    static addPersonalPictogram(newPictogram: PersonalPictogram) {
        newPictogram.category = newPictogram.category.trim().toLowerCase();
        newPictogram.name = newPictogram.name.trim().toLowerCase();

        let personalPictograms = PersonalPictogramService.getPersonalPictograms();
        if (personalPictograms.find((p) => p.name.toLowerCase().trim() === newPictogram.name.toLowerCase().trim())) return;

        if (personalPictograms) {
            personalPictograms.push(newPictogram);
        } else {
            personalPictograms = [newPictogram];
        }
        let tmp = newPictogram;
        tmp.name = tmp.name.trim();
        try {
            localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
        } catch (e) {
            throw e;
        }
    }

    static deletePersonalPictogram(pictogram: PersonalPictogram) {
        let personalPictograms = PersonalPictogramService.getPersonalPictograms();
        personalPictograms = personalPictograms.filter((p) => p.name !== pictogram.name);
        localStorage.setItem('personalPictograms', JSON.stringify(personalPictograms));
    }

    static personalToPictogram(p: PersonalPictogram) {
        return Utils.personalPictogramToPictogram(p);
    }
}
