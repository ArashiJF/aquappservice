export class Icam {
    date: string;
    icampff_avg: number;
    icampffs: number[];
    nodes: string[];
}

export class WaterBodyProperty {
    type: string;
    name:string;
    icamfs: Icam[];
    icam: number;
}