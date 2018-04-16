import TestCase from "../ObjectModel/TestCase";
import Event, { IEventArgs } from "Events/Event";
import IEnvironment from "../Environment/IEnvironment";
import TestsDiscoveredEventArgs from "../ObjectModel/EventArgs/TestsDiscoveredEventArgs";
import TimeSpan from "../Utils/TimeSpan";

// override typings for
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number;

export class TestDiscoveryCache {
    public onReportTestCases: Event<TestsDiscoveredEventArgs>;
    
    private totalDiscoveredTests: number;
    private testList : Array<TestCase>;
    private cacheCapacity: number;
    private cacheExpiryTime: number;
    private cacheTimer: number;

    constructor(environment: IEnvironment, cacheCapacity: number, cacheExpiryTime: string) {
        this.testList = [];
        this.totalDiscoveredTests = 0;

        this.onReportTestCases = environment.createEvent();

        this.cacheCapacity = cacheCapacity;
        this.cacheExpiryTime = TimeSpan.StringToMS(cacheExpiryTime);
        this.cacheTimer = 0;


        this.setCacheExpireTimer();
    }
    
    public AddTest(test:TestCase): void {
        this.testList.push(test);
        this.totalDiscoveredTests += 1;
    }

    public CleanCache(): TestsDiscoveredEventArgs {
        if(!this.testList.length) {
            return <TestsDiscoveredEventArgs> {
                DiscoveredTests: [],
                TotalTestsDiscovered: this.totalDiscoveredTests
            }
        }

        let args = <TestsDiscoveredEventArgs> {
            DiscoveredTests: this.testList,
            TotalTestsDiscovered: this.totalDiscoveredTests
        };

        this.testList = [];

        return args;
    }

    private setCacheExpireTimer() {
        clearTimeout(this.cacheTimer);
        this.cacheTimer = setTimeout(this.onCacheHit, this.cacheExpiryTime);
    }

    private onCacheHit = () => {
        this.setCacheExpireTimer();
        if(this.testList.length > 0) {
            this.onReportTestCases.raise(this, this.CleanCache());
        }
    }
}